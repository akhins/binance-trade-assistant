import { NextRequest, NextResponse } from 'next/server'
import { checkAllRiskRules, getRiskRules, updateRiskRule, shouldBlockTrade } from '@/lib/risk/rules'

/**
 * GET /api/risk/check?userId=1
 * Check risk rules and trading status
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

        const result = checkAllRiskRules(parseInt(userId))
        const blockStatus = shouldBlockTrade(parseInt(userId))

        return NextResponse.json({
            ...result,
            ...blockStatus,
        })
    } catch (error: any) {
        console.error('Risk check error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

/**
 * POST /api/risk/check
 * Run risk check (same as GET but with POST body)
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

        const result = checkAllRiskRules(userId)
        const blockStatus = shouldBlockTrade(userId)

        return NextResponse.json({
            ...result,
            ...blockStatus,
        })
    } catch (error: any) {
        console.error('Risk check error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
