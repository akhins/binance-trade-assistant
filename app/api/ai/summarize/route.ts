import { NextRequest, NextResponse } from 'next/server'
import { generateTradeSummary, saveTradeSummary, getTradeSummary } from '@/lib/ai/trade-summary'
import { getTradeById } from '@/lib/binance/trades'
import getDatabase from '@/lib/db/database'
import type { TradeNote } from '@/lib/db/schema'

/**
 * POST /api/ai/summarize
 * Generate AI summary for a trade
 */
export async function POST(request: NextRequest) {
    try {
        const { userId, tradeId } = await request.json()

        if (!userId || !tradeId) {
            return NextResponse.json(
                { error: 'User ID and Trade ID required' },
                { status: 400 }
            )
        }

        // Get trade
        const trade = getTradeById(tradeId, userId)

        if (!trade) {
            return NextResponse.json(
                { error: 'Trade not found' },
                { status: 404 }
            )
        }

        // Get trade note if exists
        const db = getDatabase()
        const note = db.prepare(`
      SELECT * FROM trade_notes WHERE trade_id = ?
    `).get(tradeId) as TradeNote | undefined

        // Generate summary
        const summary = await generateTradeSummary(trade, note)

        // Save to database
        await saveTradeSummary(userId, tradeId, summary)

        return NextResponse.json({ summary })
    } catch (error: any) {
        console.error('AI summarize error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate summary' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/ai/summarize?tradeId=1
 * Get existing trade summary
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tradeId = searchParams.get('tradeId')

        if (!tradeId) {
            return NextResponse.json(
                { error: 'Trade ID required' },
                { status: 400 }
            )
        }

        const summary = getTradeSummary(parseInt(tradeId))

        if (!summary) {
            return NextResponse.json(
                { error: 'Summary not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ summary })
    } catch (error: any) {
        console.error('Get summary error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
