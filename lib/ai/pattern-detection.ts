import { generateText, createPrompt, parseAIJson } from './gemini'
import getDatabase from '../db/database'
import type { Trade, TradeNote } from '../db/schema'

interface Pattern {
    type: 'mistake' | 'success'
    description: string
    frequency: number
    examples: Array<{ tradeId: number; date: string }>
    impact: 'high' | 'medium' | 'low'
}

/**
 * Detect recurring patterns from trades and notes
 */
export async function detectPatterns(userId: number, limit: number = 50): Promise<Pattern[]> {
    const db = getDatabase()

    // Get recent trades with notes
    const tradesWithNotes = db.prepare(`
    SELECT 
      t.id, t.symbol, t.pnl, t.pnl_percentage, t.closed_at,
      tn.note, tn.error_type, tn.setup
    FROM trades t
    LEFT JOIN trade_notes tn ON t.id = tn.trade_id
    WHERE t.user_id = ? AND t.status = 'CLOSED'
    ORDER BY t.closed_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<Trade & TradeNote>

    if (tradesWithNotes.length < 5) {
        return [] // Not enough data for pattern detection
    }

    // Analyze error types
    const errorCounts = new Map<string, number>()
    const errorExamples = new Map<string, any[]>()

    for (const trade of tradesWithNotes) {
        if (trade.error_type && trade.pnl < 0) {
            errorCounts.set(trade.error_type, (errorCounts.get(trade.error_type) || 0) + 1)

            if (!errorExamples.has(trade.error_type)) {
                errorExamples.set(trade.error_type, [])
            }
            errorExamples.get(trade.error_type)!.push({
                tradeId: trade.id,
                date: trade.closed_at,
            })
        }
    }

    // Analyze successful setups
    const setupCounts = new Map<string, { wins: number; total: number; pnl: number }>()
    const setupExamples = new Map<string, any[]>()

    for (const trade of tradesWithNotes) {
        if (trade.setup) {
            if (!setupCounts.has(trade.setup)) {
                setupCounts.set(trade.setup, { wins: 0, total: 0, pnl: 0 })
            }

            const stats = setupCounts.get(trade.setup)!
            stats.total++
            stats.pnl += trade.pnl
            if (trade.pnl > 0) stats.wins++

            if (!setupExamples.has(trade.setup)) {
                setupExamples.set(trade.setup, [])
            }
            setupExamples.get(trade.setup)!.push({
                tradeId: trade.id,
                date: trade.closed_at,
            })
        }
    }

    const patterns: Pattern[] = []

    // Add mistake patterns
    for (const [errorType, count] of Array.from(errorCounts.entries())) {
        if (count >= 2) { // At least 2 occurrences
            patterns.push({
                type: 'mistake',
                description: `Recurring mistake: ${errorType}`,
                frequency: count,
                examples: errorExamples.get(errorType)!.slice(0, 3),
                impact: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
            })
        }
    }

    // Add success patterns
    for (const [setup, stats] of Array.from(setupCounts.entries())) {
        const winRate = (stats.wins / stats.total) * 100
        if (winRate >= 60 && stats.total >= 3) {
            patterns.push({
                type: 'success',
                description: `Strong setup: ${setup} (${winRate.toFixed(0)}% win rate)`,
                frequency: stats.total,
                examples: setupExamples.get(setup)!.slice(0, 3),
                impact: winRate >= 75 ? 'high' : winRate >= 65 ? 'medium' : 'low',
            })
        }
    }

    // Use AI for deeper pattern analysis on notes
    if (tradesWithNotes.some(t => t.note)) {
        const notesForAI = tradesWithNotes
            .filter(t => t.note)
            .slice(0, 20)
            .map(t => ({
                result: t.pnl > 0 ? 'win' : 'loss',
                pnl: t.pnl,
                note: t.note,
            }))

        try {
            const aiPatterns = await detectPatternsWithAI(notesForAI)
            patterns.push(...aiPatterns)
        } catch (error) {
            console.error('AI pattern detection failed:', error)
        }
    }

    return patterns.sort((a, b) => {
        const impactScore = { high: 3, medium: 2, low: 1 }
        return impactScore[b.impact] - impactScore[a.impact]
    })
}

/**
 * Use AI to detect patterns from trade notes
 */
async function detectPatternsWithAI(
    notes: Array<{ result: string; pnl: number; note?: string }>
): Promise<Pattern[]> {
    const systemContext = `You are a trading psychology and performance analyst.
Analyze the trader's notes to find recurring behavioral or strategic patterns.
Focus on:
1. Emotional patterns (FOMO, revenge trading, fear, greed)
2. Technical patterns (poor entries, exits too early/late)
3. Strategic patterns (ignoring rules, overtrading)

Be specific and actionable.`

    const userRequest = `Analyze these trade notes and identify recurring patterns:

${notes.map((n, i) => `${i + 1}. [${n.result.toUpperCase()}] ${n.pnl.toFixed(2)} USDT - "${n.note || 'No note'}"`).join('\n')}

Provide up to 3 most important patterns in JSON format:
{
  "patterns": [
    {
      "type": "mistake" or "success",
      "description": "Brief description",
      "impact": "high", "medium", or "low"
    }
  ]
}`

    const prompt = createPrompt(systemContext, userRequest)
    const response = await generateText(prompt, { temperature: 0.6 })

    try {
        const result = parseAIJson<{ patterns: Array<{ type: string; description: string; impact: string }> }>(response)

        return result.patterns.map(p => ({
            type: p.type as 'mistake' | 'success',
            description: p.description,
            frequency: 0, // Unknown from AI analysis
            examples: [],
            impact: p.impact as 'high' | 'medium' | 'low',
        }))
    } catch {
        return []
    }
}

/**
 * Save patterns to database
 */
export function savePatterns(userId: number, patterns: Pattern[]): void {
    const db = getDatabase()

    db.prepare(`
    INSERT INTO ai_insights (user_id, insight_type, content)
    VALUES (?, 'PATTERN_DETECTION', ?)
  `).run(userId, JSON.stringify(patterns))
}
