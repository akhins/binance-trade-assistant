import { NextRequest, NextResponse } from 'next/server'
import getDatabase from '@/lib/db/database'
import { subDays, format } from 'date-fns'

/**
 * GET /api/analytics/chart?userId=1&period=7d
 * Get chart data for PnL visualization
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const period = searchParams.get('period') || '30d'

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()

        // Parse period
        let days = 30
        if (period === '7d') days = 7
        else if (period === '14d') days = 14
        else if (period === '30d') days = 30
        else if (period === '90d') days = 90

        const startDate = subDays(new Date(), days)

        // Get daily PnL data
        const trades = db.prepare(`
      SELECT 
        DATE(closed_at) as date,
        SUM(pnl) as daily_pnl,
        COUNT(*) as trade_count,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses
      FROM trades
      WHERE user_id = ? AND status = 'CLOSED' AND closed_at >= ?
      GROUP BY DATE(closed_at)
      ORDER BY date ASC
    `).all(userId, startDate.toISOString()) as Array<{
            date: string
            daily_pnl: number
            trade_count: number
            wins: number
            losses: number
        }>

        // Calculate cumulative PnL
        let cumulativePnL = 0
        const chartData = trades.map(trade => {
            cumulativePnL += trade.daily_pnl
            return {
                date: format(new Date(trade.date), 'yyyy-MM-dd'),
                pnl: trade.daily_pnl,
                cumulativePnL,
                trades: trade.trade_count,
                winRate: trade.trade_count > 0
                    ? (trade.wins / trade.trade_count) * 100
                    : 0,
            }
        })

        // Get symbol performance
        const symbolPerformance = db.prepare(`
      SELECT 
        symbol,
        SUM(pnl) as total_pnl,
        COUNT(*) as trade_count,
        AVG(pnl) as avg_pnl,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as win_rate
      FROM trades
      WHERE user_id = ? AND status = 'CLOSED' AND closed_at >= ?
      GROUP BY symbol
      ORDER BY total_pnl DESC
      LIMIT 10
    `).all(userId, startDate.toISOString()) as Array<{
            symbol: string
            total_pnl: number
            trade_count: number
            avg_pnl: number
            win_rate: number
        }>

        return NextResponse.json({
            chartData,
            symbolPerformance,
            period,
        })
    } catch (error: any) {
        console.error('Chart data error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch chart data' },
            { status: 500 }
        )
    }
}
