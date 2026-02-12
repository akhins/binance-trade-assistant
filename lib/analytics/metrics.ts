import getDatabase from '../db/database'
import type { Trade, DashboardMetrics } from '../db/schema'
import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns'

/**
 * Calculate win rate
 */
export function calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0

    const winningTrades = trades.filter(t => t.pnl > 0).length
    return (winningTrades / trades.length) * 100
}

/**
 * Calculate expectancy (average $ per trade)
 */
export function calculateExpectancy(trades: Trade[]): number {
    if (trades.length === 0) return 0

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
    return totalPnL / trades.length
}

/**
 * Calculate profit factor
 */
export function calculateProfitFactor(trades: Trade[]): number {
    const wins = trades.filter(t => t.pnl > 0)
    const losses = trades.filter(t => t.pnl < 0)

    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0)
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))

    if (totalLosses === 0) return totalWins > 0 ? Infinity : 0

    return totalWins / totalLosses
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(trades: Trade[]): number {
    if (trades.length === 0) return 0

    let peak = 0
    let maxDrawdown = 0
    let runningPnL = 0

    // Sort by date
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime()
    )

    for (const trade of sortedTrades) {
        runningPnL += trade.pnl

        if (runningPnL > peak) {
            peak = runningPnL
        }

        const drawdown = peak - runningPnL
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown
        }
    }

    return maxDrawdown
}

/**
 * Get trades for a period
 */
function getTradesForPeriod(userId: number, startDate: Date): Trade[] {
    const db = getDatabase()

    return db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? 
    AND status = 'CLOSED'
    AND closed_at >= ?
    ORDER BY closed_at ASC
  `).all(userId, startDate.toISOString()) as Trade[]
}

/**
 * Calculate dashboard metrics
 */
export function calculateDashboardMetrics(userId: number): DashboardMetrics {
    const db = getDatabase()

    // Get all closed trades
    const allTrades = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? AND status = 'CLOSED'
    ORDER BY closed_at ASC
  `).all(userId) as Trade[]

    // Period-specific trades
    const todayTrades = getTradesForPeriod(userId, startOfDay(new Date()))
    const weekTrades = getTradesForPeriod(userId, startOfWeek(new Date(), { weekStartsOn: 1 }))
    const monthTrades = getTradesForPeriod(userId, startOfMonth(new Date()))

    // Calculate metrics
    const totalPnL = allTrades.reduce((sum, t) => sum + t.pnl, 0)
    const todayPnL = todayTrades.reduce((sum, t) => sum + t.pnl, 0)
    const weekPnL = weekTrades.reduce((sum, t) => sum + t.pnl, 0)
    const monthPnL = monthTrades.reduce((sum, t) => sum + t.pnl, 0)

    return {
        totalPnL,
        winRate: calculateWinRate(allTrades),
        profitFactor: calculateProfitFactor(allTrades),
        expectancy: calculateExpectancy(allTrades),
        maxDrawdown: calculateMaxDrawdown(allTrades),
        totalTrades: allTrades.length,
        todayPnL,
        weekPnL,
        monthPnL,
    }
}

/**
 * Get performance breakdown by field (JSON db compatible - no JOIN)
 */
export function getPerformanceBreakdown(
    userId: number,
    groupBy: 'setup' | 'timeframe' | 'symbol' | 'error_type'
): Array<{
    category: string
    trades: number
    totalPnL: number
    winRate: number
    avgPnL: number
}> {
    const db = getDatabase()
    const trades = db.prepare(`
      SELECT * FROM trades
      WHERE user_id = ? AND status = 'CLOSED'
    `).all(userId) as Trade[]

    const notesMap = new Map<number, any>()
    const notes = db.prepare('SELECT * FROM trade_notes').all() as any[]
    for (const n of notes) {
        notesMap.set(n.trade_id, n)
    }

    const groups = new Map<string, { trades: number; pnl: number; wins: number }>()

    for (const trade of trades) {
        let category: string | null = null
        if (groupBy === 'symbol') {
            category = trade.symbol
        } else {
            const note = notesMap.get(trade.id)
            if (note && note[groupBy]) {
                category = note[groupBy]
            }
        }
        if (!category) continue

        if (!groups.has(category)) {
            groups.set(category, { trades: 0, pnl: 0, wins: 0 })
        }
        const g = groups.get(category)!
        g.trades++
        g.pnl += trade.pnl
        if (trade.pnl > 0) g.wins++
    }

    return Array.from(groups.entries())
        .map(([category, stats]) => ({
            category,
            trades: stats.trades,
            totalPnL: stats.pnl,
            winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
            avgPnL: stats.trades > 0 ? stats.pnl / stats.trades : 0,
        }))
        .sort((a, b) => b.totalPnL - a.totalPnL)
}

/**
 * Get performance by hour of day
 */
export function getPerformanceByHour(userId: number): Array<{
    hour: number
    trades: number
    totalPnL: number
    winRate: number
}> {
    const db = getDatabase()

    const trades = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? AND status = 'CLOSED'
  `).all(userId) as Trade[]

    const hourlyStats = new Map<number, { trades: number; pnl: number; wins: number }>()

    for (const trade of trades) {
        const hour = new Date(trade.opened_at).getHours()

        if (!hourlyStats.has(hour)) {
            hourlyStats.set(hour, { trades: 0, pnl: 0, wins: 0 })
        }

        const stats = hourlyStats.get(hour)!
        stats.trades++
        stats.pnl += trade.pnl
        if (trade.pnl > 0) stats.wins++
    }

    const result: any[] = []

    for (let hour = 0; hour < 24; hour++) {
        const stats = hourlyStats.get(hour) || { trades: 0, pnl: 0, wins: 0 }
        result.push({
            hour,
            trades: stats.trades,
            totalPnL: stats.pnl,
            winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        })
    }

    return result
}

/**
 * Get performance by day of week
 */
export function getPerformanceByDayOfWeek(userId: number): Array<{
    day: string
    trades: number
    totalPnL: number
    winRate: number
}> {
    const db = getDatabase()

    const trades = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? AND status = 'CLOSED'
  `).all(userId) as Trade[]

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyStats = new Map<number, { trades: number; pnl: number; wins: number }>()

    for (const trade of trades) {
        const day = new Date(trade.opened_at).getDay()

        if (!dailyStats.has(day)) {
            dailyStats.set(day, { trades: 0, pnl: 0, wins: 0 })
        }

        const stats = dailyStats.get(day)!
        stats.trades++
        stats.pnl += trade.pnl
        if (trade.pnl > 0) stats.wins++
    }

    const result: any[] = []

    for (let day = 0; day < 7; day++) {
        const stats = dailyStats.get(day) || { trades: 0, pnl: 0, wins: 0 }
        result.push({
            day: dayNames[day],
            trades: stats.trades,
            totalPnL: stats.pnl,
            winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        })
    }

    return result
}

/**
 * Get best and worst performing conditions
 */
export function getBestWorstConditions(userId: number): {
    best: Array<{ condition: string; pnl: number; winRate: number }>
    worst: Array<{ condition: string; pnl: number; winRate: number }>
} {
    // Get setup breakdown
    const setupBreakdown = getPerformanceBreakdown(userId, 'setup')

    // Sort by PnL
    const sorted = [...setupBreakdown].sort((a, b) => b.totalPnL - a.totalPnL)

    const best = sorted.slice(0, 3).map(s => ({
        condition: s.category,
        pnl: s.totalPnL,
        winRate: s.winRate,
    }))

    const worst = sorted.slice(-3).reverse().map(s => ({
        condition: s.category,
        pnl: s.totalPnL,
        winRate: s.winRate,
    }))

    return { best, worst }
}
