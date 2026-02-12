import { NextRequest, NextResponse } from 'next/server'
import getDatabase from '@/lib/db/database'
import type { Trade, TradeNote, CreateTradeNoteRequest } from '@/lib/db/schema'

/**
 * GET /api/trades?userId=1&limit=50&status=CLOSED
 * Get trades list with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status') || 'CLOSED'
        const symbol = searchParams.get('symbol')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()

        let query = `
      SELECT * FROM trades
      WHERE user_id = ?
    `
        const params: any[] = [userId]

        if (status) {
            query += ' AND status = ?'
            params.push(status)
        }

        if (symbol) {
            query += ' AND symbol = ?'
            params.push(symbol)
        }

        query += ' ORDER BY opened_at DESC LIMIT ?'
        params.push(limit)

        const trades = db.prepare(query).all(...params) as Trade[]

        // Fetch notes for each trade (no JOIN support in JSON db)
        const tradesWithNotes = trades.map(trade => {
            const note = db.prepare('SELECT * FROM trade_notes WHERE trade_id = ?').get(trade.id) as any
            if (note) {
                return { ...trade, note: note.note, tags: note.tags, setup: note.setup, timeframe: note.timeframe, error_type: note.error_type, screenshot_url: note.screenshot_url, tradingview_link: note.tradingview_link }
            }
            return trade
        })

        return NextResponse.json({ trades: tradesWithNotes })
    } catch (error: any) {
        console.error('Get trades error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

/**
 * POST /api/trades
 * Create manual trade or add note to existing trade
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, tradeNote, manualTrade } = body

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()

        // Add note to existing trade
        if (tradeNote) {
            const { trade_id, note, tags, setup, timeframe, error_type, screenshot_url, tradingview_link } = tradeNote as CreateTradeNoteRequest

            // Check if note already exists
            const existing = db.prepare(`
        SELECT id FROM trade_notes WHERE trade_id = ?
      `).get(trade_id)

            if (existing) {
                // Update existing note
                db.prepare(`
          UPDATE trade_notes
          SET note = ?, tags = ?, setup = ?, timeframe = ?, error_type = ?,
              screenshot_url = ?, tradingview_link = ?, updated_at = CURRENT_TIMESTAMP
          WHERE trade_id = ?
        `).run(
                    note || null,
                    tags ? JSON.stringify(tags) : null,
                    setup || null,
                    timeframe || null,
                    error_type || null,
                    screenshot_url || null,
                    tradingview_link || null,
                    trade_id
                )
            } else {
                // Insert new note
                db.prepare(`
          INSERT INTO trade_notes (trade_id, note, tags, setup, timeframe, error_type, screenshot_url, tradingview_link)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                    trade_id,
                    note || null,
                    tags ? JSON.stringify(tags) : null,
                    setup || null,
                    timeframe || null,
                    error_type || null,
                    screenshot_url || null,
                    tradingview_link || null
                )
            }

            return NextResponse.json({ success: true, message: 'Trade note saved' })
        }

        // Create manual trade
        if (manualTrade) {
            const {
                symbol,
                side,
                type,
                entry_price,
                exit_price,
                quantity,
                stop_loss,
                take_profit,
                leverage = 1,
                commission = 0,
            } = manualTrade

            const position_size_usdt = entry_price * quantity
            const pnl = side === 'BUY'
                ? (exit_price - entry_price) * quantity - commission
                : (entry_price - exit_price) * quantity - commission
            const pnl_percentage = (pnl / position_size_usdt) * 100

            const result = db.prepare(`
        INSERT INTO trades (
          user_id, symbol, side, type, quantity, price, executed_qty,
          commission, entry_price, exit_price, stop_loss, take_profit,
          leverage, position_size_usdt, pnl, pnl_percentage, status,
          opened_at, closed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
                userId, symbol, side, type, quantity, entry_price, quantity,
                commission, entry_price, exit_price, stop_loss, take_profit,
                leverage, position_size_usdt, pnl, pnl_percentage
            )

            return NextResponse.json({
                success: true,
                tradeId: result.lastInsertRowid,
                message: 'Manual trade created',
            })
        }

        return NextResponse.json(
            { error: 'Invalid request: provide either tradeNote or manualTrade' },
            { status: 400 }
        )
    } catch (error: any) {
        console.error('Create trade/note error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
