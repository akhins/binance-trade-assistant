import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceBreakdown, getPerformanceByHour, getPerformanceByDayOfWeek } from '@/lib/analytics/metrics'

/**
 * GET /api/analytics/breakdown?userId=1&groupBy=setup
 * Get performance breakdown by different dimensions
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const groupBy = searchParams.get('groupBy') as 'setup' | 'timeframe' | 'symbol' | 'error_type' || 'setup'
        const timeAnalysis = searchParams.get('timeAnalysis') // 'hour' or 'day'

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const userIdNum = parseInt(userId)

        if (timeAnalysis === 'hour') {
            const hourlyData = getPerformanceByHour(userIdNum)
            return NextResponse.json({ breakdown: hourlyData, type: 'hourly' })
        }

        if (timeAnalysis === 'day') {
            const dailyData = getPerformanceByDayOfWeek(userIdNum)
            return NextResponse.json({ breakdown: dailyData, type: 'daily' })
        }

        const breakdown = getPerformanceBreakdown(userIdNum, groupBy)

        return NextResponse.json({ breakdown, groupBy })
    } catch (error: any) {
        console.error('Performance breakdown error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
