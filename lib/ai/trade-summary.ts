import { generateText, createPrompt, parseAIJson } from './gemini'
import type { Trade, TradeNote } from '../db/schema'

interface TradeSummary {
    entry: string
    exit: string
    result: string
    keyFactors: string[]
    mistakes?: string[]
    whatWentWell?: string[]
}

/**
 * Generate AI summary for a closed trade
 */
export async function generateTradeSummary(
    trade: Trade,
    note?: TradeNote
): Promise<TradeSummary> {
    const systemContext = `You are an expert trading analyst. Analyze the trade and provide a concise summary.
Focus on:
1. Entry and exit analysis
2. Key success or failure factors
3. Specific, actionable insights

Keep your response brief and to the point.`

    const tradeData = {
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        pnl: trade.pnl,
        pnlPercentage: trade.pnl_percentage,
        leverage: trade.leverage,
        setup: note?.setup,
        timeframe: note?.timeframe,
        errorType: note?.error_type,
        userNote: note?.note,
    }

    const userRequest = `Analyze this ${trade.side} trade on ${trade.symbol}.
Result: ${trade.pnl > 0 ? 'Profit' : 'Loss'} of ${trade.pnl.toFixed(2)} USDT (${trade.pnl_percentage.toFixed(2)}%).
${note?.note ? `Trader's note: ${note.note}` : ''}

Provide a JSON response with this structure:
{
  "entry": "Brief entry analysis (1 sentence)",
  "exit": "Brief exit analysis (1 sentence)",
  "result": "Overall result summary (1 sentence)",
  "keyFactors": ["factor1", "factor2", "factor3"],
  ${trade.pnl < 0 ? '"mistakes": ["mistake1", "mistake2"],' : '"whatWentWell": ["success1", "success2"],'}
}`

    const prompt = createPrompt(systemContext, userRequest, tradeData)
    const response = await generateText(prompt, { temperature: 0.5 })

    try {
        return parseAIJson<TradeSummary>(response)
    } catch {
        // Fallback if JSON parsing fails
        return {
            entry: 'Entry analysis unavailable',
            exit: 'Exit analysis unavailable',
            result: response.slice(0, 200),
            keyFactors: ['AI response parsing failed'],
        }
    }
}

/**
 * Save trade summary to database
 */
export async function saveTradeSummary(
    userId: number,
    tradeId: number,
    summary: TradeSummary
): Promise<void> {
    const getDatabase = (await import('../db/database')).default
    const db = getDatabase()

    db.prepare(`
    INSERT INTO ai_insights (user_id, trade_id, insight_type, content)
    VALUES (?, ?, 'TRADE_SUMMARY', ?)
  `).run(userId, tradeId, JSON.stringify(summary))
}

/**
 * Get trade summary from database
 */
export function getTradeSummary(tradeId: number): TradeSummary | null {
    const getDatabase = require('../db/database').default
    const db = getDatabase()

    const insight = db.prepare(`
    SELECT content FROM ai_insights
    WHERE trade_id = ? AND insight_type = 'TRADE_SUMMARY'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(tradeId) as { content: string } | undefined

    if (!insight) return null

    try {
        return JSON.parse(insight.content) as TradeSummary
    } catch {
        return null
    }
}
