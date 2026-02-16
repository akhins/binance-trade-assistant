import { NextRequest, NextResponse } from 'next/server'
import { getBinanceClient } from '@/lib/binance/client'
import { syncTrades, matchTradesAndCalculatePnL } from '@/lib/binance/trades'
import getDatabase from '@/lib/db/database'
import { config } from '@/lib/config'

/**
 * POST /api/binance/sync
 * Sync trades from Binance
 */
export async function POST(request: NextRequest) {
    try {
        const { userId, symbols = ['BTCUSDT', 'ETHUSDT'] } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        // Get user credentials
        const db = getDatabase()
        const user = db.prepare(`
      SELECT encrypted_api_key, encrypted_api_secret FROM users WHERE id = ?
    `).get(userId) as { encrypted_api_key?: string; encrypted_api_secret?: string } | undefined

        if (!user || !user.encrypted_api_key || !user.encrypted_api_secret) {
            return NextResponse.json(
                { error: 'No API credentials found.  Please connect to Binance first.' },
                { status: 400 }
            )
        }

        // Initialize client - use config network setting
        const useTestnet = config.binance.network !== 'mainnet'
        const client = getBinanceClient(useTestnet)
        client.initialize(user.encrypted_api_key, user.encrypted_api_secret)

        // Sync trades
        const { synced, errors } = await syncTrades(client, parseInt(userId), symbols)

        // Match trades and calculate PnL
        const matched = matchTradesAndCalculatePnL(parseInt(userId))

        return NextResponse.json({
            success: true,
            synced,
            matched,
            errors,
            message: `Synced ${synced} new trades, matched ${matched} trades`,
        })
    } catch (error: any) {
        console.error('Trade sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to sync trades' },
            { status: 500 }
        )
    }
}
