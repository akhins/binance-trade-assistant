import { BinanceClient } from './client'
import getDatabase from '../db/database'
import type { Trade } from '../db/schema'

interface BinanceTrade {
    symbol: string
    id: number
    orderId: number
    orderListId: number
    price: string
    qty: string
    quoteQty: string
    commission: string
    commissionAsset: string
    time: number
    isBuyer: boolean
    isMaker: boolean
    isBestMatch: boolean
}

/**
 * Calculate real PnL including all fees
 */
export function calculateRealPnL(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    commission: number,
    side: 'BUY' | 'SELL',
    leverage: number = 1
): { pnl: number; pnlPercentage: number } {
    let pnl = 0

    if (side === 'BUY') {
        // Long position: profit when price goes up
        pnl = (exitPrice - entryPrice) * quantity * leverage
    } else {
        // Short position: profit when price goes down
        pnl = (entryPrice - exitPrice) * quantity * leverage
    }

    // Subtract commission
    pnl -= commission

    // Calculate percentage
    const positionValue = entryPrice * quantity
    const pnlPercentage = positionValue > 0 ? (pnl / positionValue) * 100 : 0

    return { pnl, pnlPercentage }
}

/**
 * Convert Binance trade to our Trade format
 */
function convertBinanceTradeToTrade(
    binanceTrade: BinanceTrade,
    userId: number
): Partial<Trade> {
    const side: 'BUY' | 'SELL' = binanceTrade.isBuyer ? 'BUY' : 'SELL'
    const price = parseFloat(binanceTrade.price)
    const quantity = parseFloat(binanceTrade.qty)
    const commission = parseFloat(binanceTrade.commission)
    const positionSizeUsdt = parseFloat(binanceTrade.quoteQty)

    return {
        user_id: userId,
        binance_order_id: binanceTrade.orderId.toString(),
        symbol: binanceTrade.symbol,
        side,
        type: 'MARKET', // We'll need to fetch order details for exact type
        quantity,
        price,
        executed_qty: quantity,
        commission,
        commission_asset: binanceTrade.commissionAsset,
        position_size_usdt: positionSizeUsdt,
        entry_price: price,
        status: 'CLOSED', // Fetched trades are already executed
        opened_at: new Date(binanceTrade.time).toISOString(),
        closed_at: new Date(binanceTrade.time).toISOString(),
    }
}

/**
 * Sync trades from Binance to local database
 */
export async function syncTrades(
    client: BinanceClient,
    userId: number,
    symbols: string[] = ['BTCUSDT', 'ETHUSDT']
): Promise<{ synced: number; errors: number }> {
    const db = getDatabase()
    let syncedCount = 0
    let errorCount = 0

    for (const symbol of symbols) {
        try {
            // Fetch trades from Binance
            const binanceTrades = await client.getMyTrades(symbol, 500)

            for (const binanceTrade of binanceTrades) {
                try {
                    // Check if trade already exists
                    const existing = db.prepare(
                        'SELECT id FROM trades WHERE binance_order_id = ? AND user_id = ?'
                    ).get(binanceTrade.orderId.toString(), userId)

                    if (existing) continue // Skip if already synced

                    // Convert and insert
                    const trade = convertBinanceTradeToTrade(binanceTrade, userId)

                    const result = db.prepare(`
            INSERT INTO trades (
              user_id, binance_order_id, symbol, side, type, quantity, price,
              executed_qty, commission, commission_asset, position_size_usdt,
              entry_price, status, opened_at, closed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
                        trade.user_id,
                        trade.binance_order_id,
                        trade.symbol,
                        trade.side,
                        trade.type,
                        trade.quantity,
                        trade.price,
                        trade.executed_qty,
                        trade.commission,
                        trade.commission_asset,
                        trade.position_size_usdt,
                        trade.entry_price,
                        trade.status,
                        trade.opened_at,
                        trade.closed_at
                    )

                    if (result.changes > 0) {
                        syncedCount++
                    }
                } catch (tradeError) {
                    console.error(`Error syncing trade ${binanceTrade.orderId}:`, tradeError)
                    errorCount++
                }
            }
        } catch (symbolError) {
            console.error(`Error fetching trades for ${symbol}:`, symbolError)
            errorCount++
        }
    }

    return { synced: syncedCount, errors: errorCount }
}

/**
 * Match trades to find entry/exit pairs and calculate PnL
 */
export function matchTradesAndCalculatePnL(userId: number): number {
    const db = getDatabase()
    let updatedCount = 0

    // Get all trades for user, ordered by time
    const trades = db.prepare(`
    SELECT * FROM trades 
    WHERE user_id = ? AND status = 'CLOSED'
    ORDER BY opened_at ASC
  `).all(userId) as Trade[]

    // Group by symbol
    const tradesBySymbol = new Map<string, Trade[]>()

    for (const trade of trades) {
        if (!tradesBySymbol.has(trade.symbol)) {
            tradesBySymbol.set(trade.symbol, [])
        }
        tradesBySymbol.get(trade.symbol)!.push(trade)
    }

    // Match entry/exit for each symbol
    for (const [symbol, symbolTrades] of Array.from(tradesBySymbol.entries())) {
        let position: { side: 'BUY' | 'SELL'; quantity: number; entryPrice: number } | null = null

        for (const trade of symbolTrades) {
            if (!position) {
                // Opening position
                position = {
                    side: trade.side,
                    quantity: trade.executed_qty,
                    entryPrice: trade.price,
                }
            } else if (position.side !== trade.side) {
                // Closing position
                const { pnl, pnlPercentage } = calculateRealPnL(
                    position.entryPrice,
                    trade.price,
                    Math.min(position.quantity, trade.executed_qty),
                    trade.commission,
                    position.side,
                    trade.leverage || 1
                )

                // Update trade with calculated PnL
                db.prepare(`
          UPDATE trades 
          SET pnl = ?, pnl_percentage = ?, exit_price = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(pnl, pnlPercentage, trade.price, trade.id)

                updatedCount++

                // Adjust or close position
                if (trade.executed_qty >= position.quantity) {
                    position = null
                } else {
                    position.quantity -= trade.executed_qty
                }
            } else {
                // Adding to position (same side)
                const totalValue = position.entryPrice * position.quantity + trade.price * trade.executed_qty
                const totalQty = position.quantity + trade.executed_qty
                position.entryPrice = totalValue / totalQty
                position.quantity = totalQty
            }
        }
    }

    return updatedCount
}

/**
 * Get recent trades for a user
 */
export function getRecentTrades(userId: number, limit: number = 50): Trade[] {
    const db = getDatabase()

    return db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    ORDER BY opened_at DESC
    LIMIT ?
  `).all(userId, limit) as Trade[]
}

/**
 * Get trade by ID
 */
export function getTradeById(tradeId: number, userId: number): Trade | null {
    const db = getDatabase()

    return db.prepare(`
    SELECT * FROM trades
    WHERE id = ? AND user_id = ?
  `).get(tradeId, userId) as Trade | null
}
