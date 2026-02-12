import { generateText, createPrompt, parseAIJson } from './gemini'
import getDatabase from '../db/database'
import { detectPatterns } from './pattern-detection'
import { getBestWorstConditions } from '../analytics/metrics'
import { startOfWeek, endOfWeek } from 'date-fns'
import type { Trade } from '../db/schema'

interface WeeklyReport {
    weekStart: string
    weekEnd: string
    summary: {
        totalTrades: number
        totalPnL: number
        winRate: number
        biggestWin: number
        biggestLoss: number
    }
    topHabits: string[]
    topMistakes: string[]
    recommendations: string[]
    focusAreas: string[]
}

/**
 * Generate weekly report with AI insights
 */
export async function generateWeeklyReport(userId: number): Promise<WeeklyReport> {
    const db = getDatabase()

    // Get week boundaries
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

    // Fetch week's trades
    const weekTrades = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? 
    AND status = 'CLOSED'
    AND closed_at >= ?
    AND closed_at <= ?
    ORDER BY closed_at ASC
  `).all(userId, weekStart.toISOString(), weekEnd.toISOString()) as Trade[]

    // Calculate basic stats
    const totalTrades = weekTrades.length
    const totalPnL = weekTrades.reduce((sum, t) => sum + t.pnl, 0)
    const winningTrades = weekTrades.filter(t => t.pnl > 0)
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0
    const biggestWin = Math.max(...weekTrades.map(t => t.pnl), 0)
    const biggestLoss = Math.min(...weekTrades.map(t => t.pnl), 0)

    // Get patterns and best/worst conditions
    const patterns = await detectPatterns(userId, 100)
    const { best, worst } = getBestWorstConditions(userId)

    // Prepare data for AI
    const weekData = {
        trades: totalTrades,
        pnl: totalPnL,
        winRate: winRate.toFixed(1),
        biggestWin,
        biggestLoss,
        patterns: patterns.slice(0, 5).map(p => ({
            type: p.type,
            description: p.description,
            impact: p.impact,
        })),
        bestConditions: best.slice(0, 3),
        worstConditions: worst.slice(0, 3),
    }

    // Generate AI report
    const systemContext = `You are an expert trading coach analyzing a trader's weekly performance.
Your goal is to provide:
1. Top 3 positive habits/behaviors to maintain
2. Top 3 mistakes/bad habits to fix
3. 1-2 specific, actionable recommendations for next week

Be encouraging but honest. Focus on behavioral improvements, not just results.
Keep recommendations specific and measurable.`

    const userRequest = `Analyze this week's trading performance and create a weekly report.

Week summary:
- Trades: ${totalTrades}
- PnL: ${totalPnL.toFixed(2)} USDT
- Win Rate: ${winRate.toFixed(1)}%
- Biggest Win: ${biggestWin.toFixed(2)} USDT
- Biggest Loss: ${biggestLoss.toFixed(2)} USDT

Identified patterns:
${patterns.slice(0, 5).map(p => `- [${p.type.toUpperCase()}] ${p.description} (Impact: ${p.impact})`).join('\n')}

Best performing conditions:
${best.slice(0, 3).map(b => `- ${b.condition}: ${b.pnl.toFixed(2)} USDT (${b.winRate.toFixed(1)}% win rate)`).join('\n')}

Worst performing conditions:
${worst.slice(0, 3).map(w => `- ${w.condition}: ${w.pnl.toFixed(2)} USDT (${w.winRate.toFixed(1)}% win rate)`).join('\n')}

Provide a JSON response:
{
  "topHabits": ["habit1", "habit2", "habit3"],
  "topMistakes": ["mistake1", "mistake2", "mistake3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "focusAreas": ["focus1", "focus2"]
}`

    const prompt = createPrompt(systemContext, userRequest, weekData)
    const response = await generateText(prompt, { temperature: 0.6, maxTokens: 1500 })

    let aiInsights: any

    try {
        aiInsights = parseAIJson(response)
    } catch {
        // Fallback if parsing fails
        aiInsights = {
            topHabits: ['Continue tracking your trades diligently'],
            topMistakes: ['Review trade notes for improvement areas'],
            recommendations: ['Focus on consistent execution of your strategy'],
            focusAreas: ['Risk management'],
        }
    }

    return {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        summary: {
            totalTrades,
            totalPnL,
            winRate,
            biggestWin,
            biggestLoss,
        },
        ...aiInsights,
    }
}

/**
 * Save weekly report to database
 */
export function saveWeeklyReport(userId: number, report: WeeklyReport): void {
    const db = getDatabase()

    db.prepare(`
    INSERT INTO ai_insights (user_id, insight_type, content)
    VALUES (?, 'WEEKLY_REPORT', ?)
  `).run(userId, JSON.stringify(report))
}

/**
 * Get latest weekly report
 */
export function getLatestWeeklyReport(userId: number): WeeklyReport | null {
    const db = getDatabase()

    const insight = db.prepare(`
    SELECT content FROM ai_insights
    WHERE user_id = ? AND insight_type = 'WEEKLY_REPORT'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId) as { content: string } | undefined

    if (!insight) return null

    try {
        return JSON.parse(insight.content) as WeeklyReport
    } catch {
        return null
    }
}

/**
 * Get all weekly reports
 */
export function getAllWeeklyReports(userId: number, limit: number = 10): WeeklyReport[] {
    const db = getDatabase()

    const insights = db.prepare(`
    SELECT content FROM ai_insights
    WHERE user_id = ? AND insight_type = 'WEEKLY_REPORT'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<{ content: string }>

    return insights
        .map(i => {
            try {
                return JSON.parse(i.content) as WeeklyReport
            } catch {
                return null
            }
        })
        .filter((r): r is WeeklyReport => r !== null)
}
