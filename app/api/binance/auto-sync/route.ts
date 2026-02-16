import { NextRequest, NextResponse } from 'next/server'
import { getBinanceClient } from '@/lib/binance/client'
import { syncTrades, matchTradesAndCalculatePnL } from '@/lib/binance/trades'
import { generateTradeSummary, saveTradeSummary } from '@/lib/ai/trade-summary'
import getDatabase from '@/lib/db/database'
import { config } from '@/lib/config'

/**
 * POST /api/binance/auto-sync
 * Automatic trade synchronization with AI analysis
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

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
                { error: 'No API credentials found. Please connect to Binance first.' },
                { status: 400 }
            )
        }

        // Get user's auto-sync settings
        const settings = db.prepare(`
      SELECT auto_sync_enabled, auto_sync_interval, auto_ai_analysis FROM users WHERE id = ?
    `).get(userId) as {
            auto_sync_enabled?: number
            auto_sync_interval?: number
            auto_ai_analysis?: number
        } | undefined

        if (!settings?.auto_sync_enabled) {
            return NextResponse.json({
                success: false,
                message: 'Auto-sync is disabled',
            })
        }

        // Initialize client
        const useTestnet = config.binance.network !== 'mainnet'
        const client = getBinanceClient(useTestnet)
        client.initialize(user.encrypted_api_key, user.encrypted_api_secret)

        // Get all symbols from user's recent trades
        const recentTrades = db.prepare(`
      SELECT DISTINCT symbol FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(userId) as Array<{ symbol: string }>

        const symbols = recentTrades.length > 0
            ? recentTrades.map(t => t.symbol)
            : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']

        // Sync trades
        const { synced, errors } = await syncTrades(client, parseInt(userId), symbols)

        // Match trades and calculate PnL
        const matched = matchTradesAndCalculatePnL(parseInt(userId))

        // Auto AI analysis for new trades if enabled
        let aiAnalyzed = 0
        if (settings.auto_ai_analysis) {
            const newTrades = db.prepare(`
        SELECT * FROM trades 
        WHERE user_id = ? AND status = 'CLOSED' 
        ORDER BY closed_at DESC LIMIT ?
      `).all(userId, synced) as any[]

            for (const trade of newTrades) {
                try {
                    const summary = await generateTradeSummary(trade)
                    await saveTradeSummary(parseInt(userId), trade.id, summary)
                    aiAnalyzed++
                } catch (error) {
                    console.error(`Failed to analyze trade ${trade.id}:`, error)
                }
            }
        }

        return NextResponse.json({
            success: true,
            synced,
            matched,
            aiAnalyzed,
            errors,
            message: `Synced ${synced} new trades, matched ${matched} trades${aiAnalyzed > 0 ? `, analyzed ${aiAnalyzed} trades with AI` : ''}`,
        })
    } catch (error: any) {
        console.error('Auto-sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to auto-sync trades' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/binance/auto-sync?userId=1
 * Get auto-sync status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()
        const settings = db.prepare(`
      SELECT auto_sync_enabled, auto_sync_interval, auto_ai_analysis, last_sync_at FROM users WHERE id = ?
    `).get(userId) as {
            auto_sync_enabled?: number
            auto_sync_interval?: number
            auto_ai_analysis?: number
            last_sync_at?: string
        } | undefined

        return NextResponse.json({
            enabled: settings?.auto_sync_enabled === 1,
            interval: settings?.auto_sync_interval || 15, // minutes
            aiAnalysis: settings?.auto_ai_analysis === 1,
            lastSync: settings?.last_sync_at,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
