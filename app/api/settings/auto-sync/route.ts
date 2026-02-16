import { NextRequest, NextResponse } from 'next/server'
import getDatabase from '@/lib/db/database'

/**
 * POST /api/settings/auto-sync
 * Update auto-sync settings
 */
export async function POST(request: NextRequest) {
    try {
        const { userId, enabled, interval, aiAnalysis } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        const db = getDatabase()

        // Update user settings
        db.prepare(`
      UPDATE users
      SET 
        auto_sync_enabled = ?,
        auto_sync_interval = ?,
        auto_ai_analysis = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            enabled ? 1 : 0,
            interval || 15,
            aiAnalysis ? 1 : 0,
            userId
        )

        return NextResponse.json({
            success: true,
            message: 'Auto-sync settings updated',
        })
    } catch (error: any) {
        console.error('Update auto-sync settings error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        )
    }
}
