import { NextRequest, NextResponse } from 'next/server'
import { getRiskRules, updateRiskRule } from '@/lib/risk/rules'
import getDatabase from '@/lib/db/database'

/**
 * GET /api/risk/rules?userId=1
 * Get all risk rules for user
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

        const rules = getRiskRules(parseInt(userId))

        return NextResponse.json({ rules })
    } catch (error: any) {
        console.error('Get risk rules error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/risk/rules
 * Update a risk rule
 */
export async function PATCH(request: NextRequest) {
    try {
        const { userId, ruleId, limitValue, isActive } = await request.json()

        if (!userId || !ruleId) {
            return NextResponse.json(
                { error: 'User ID and Rule ID required' },
                { status: 400 }
            )
        }

        const success = updateRiskRule(ruleId, userId, limitValue, isActive)

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update rule' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Risk rule updated',
        })
    } catch (error: any) {
        console.error('Update risk rule error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
