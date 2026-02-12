import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyReport, saveWeeklyReport, getLatestWeeklyReport, getAllWeeklyReports } from '@/lib/ai/weekly-report'

/**
 * POST /api/ai/weekly-report
 * Generate weekly report
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

        // Generate report
        const report = await generateWeeklyReport(userId)

        // Save to database
        saveWeeklyReport(userId, report)

        return NextResponse.json({ report })
    } catch (error: any) {
        console.error('Weekly report generation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate weekly report' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/ai/weekly-report?userId=1&all=false
 * Get weekly report(s)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const all = searchParams.get('all') === 'true'

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        if (all) {
            const reports = getAllWeeklyReports(parseInt(userId))
            return NextResponse.json({ reports })
        } else {
            const report = getLatestWeeklyReport(parseInt(userId))

            if (!report) {
                return NextResponse.json(
                    { error: 'No weekly report found' },
                    { status: 404 }
                )
            }

            return NextResponse.json({ report })
        }
    } catch (error: any) {
        console.error('Get weekly report error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
