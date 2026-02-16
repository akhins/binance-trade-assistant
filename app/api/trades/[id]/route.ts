import { NextRequest, NextResponse } from 'next/server'
import getDatabase from '@/lib/db/database'
import { getTradeSummary } from '@/lib/ai/trade-summary'
import type { Trade, TradeNote } from '@/lib/db/schema'

/**
 * GET /api/trades/[id]?userId=1
 * Get trade details with note and AI summary
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const tradeId = parseInt(params.id)

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()

        // Get trade
        const trade = db.prepare(`
      SELECT * FROM trades WHERE id = ? AND user_id = ?
    `).get(tradeId, userId) as Trade | undefined

        if (!trade) {
            return NextResponse.json(
                { error: 'Trade not found' },
                { status: 404 }
            )
        }

        // Get trade note
        const note = db.prepare(`
      SELECT * FROM trade_notes WHERE trade_id = ?
    `).get(tradeId) as TradeNote | undefined

        // Get AI summary
        const aiSummary = getTradeSummary(tradeId)

        return NextResponse.json({
            trade,
            note: note || null,
            aiSummary: aiSummary || null,
        })
    } catch (error: any) {
        console.error('Get trade details error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch trade details' },
            { status: 500 }
        )
    }
}
