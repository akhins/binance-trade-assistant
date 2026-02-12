import { NextRequest, NextResponse } from 'next/server'
import { calculateDashboardMetrics, getPerformanceBreakdown } from '@/lib/analytics/metrics'

/**
 * GET /api/analytics/dashboard?userId=1
 * Get dashboard metrics
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

        const metrics = calculateDashboardMetrics(parseInt(userId))

        return NextResponse.json({ metrics })
    } catch (error: any) {
        console.error('Dashboard metrics error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
