import { NextRequest, NextResponse } from 'next/server'
import { getBinanceClient } from '@/lib/binance/client'
import { encrypt, validateApiKey, validateApiSecret } from '@/lib/security/encryption'
import getDatabase from '@/lib/db/database'
import { config } from '@/lib/config'

/**
 * POST /api/binance/connect
 * Connect Binance API keys
 */
export async function POST(request: NextRequest) {
    try {
        const { apiKey, apiSecret, userId, useTestnet } = await request.json()

        // Validate input
        if (!apiKey || !apiSecret || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate API credentials format
        if (!validateApiKey(apiKey)) {
            return NextResponse.json(
                { error: 'Invalid API key format' },
                { status: 400 }
            )
        }

        if (!validateApiSecret(apiSecret)) {
            return NextResponse.json(
                { error: 'Invalid API secret format' },
                { status: 400 }
            )
        }

        // Encrypt credentials
        const encryptedApiKey = encrypt(apiKey)
        const encryptedApiSecret = encrypt(apiSecret)

        // Test connection - use config network setting (mainnet by default)
        const useTestnetNetwork = typeof useTestnet === 'boolean'
            ? useTestnet
            : config.binance.network !== 'mainnet'
        const client = getBinanceClient(useTestnetNetwork)
        client.initialize(encryptedApiKey, encryptedApiSecret)

        const isConnected = await client.testConnection()

        if (!isConnected) {
            return NextResponse.json(
                { error: 'Failed to connect to Binance. Please check your API credentials.' },
                { status: 401 }
            )
        }

        // Save encrypted credentials to database
        const db = getDatabase()
        db.prepare(`
      UPDATE users
      SET encrypted_api_key = ?, encrypted_api_secret = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(encryptedApiKey, encryptedApiSecret, userId)

        return NextResponse.json({
            success: true,
            message: 'Successfully connected to Binance',
            network: config.binance.network,
            testnet: useTestnetNetwork,
        })
    } catch (error: any) {
        console.error('Binance connection error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to connect to Binance' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/binance/connect?userId=1
 * Check connection status
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
        const user = db.prepare(`
      SELECT encrypted_api_key, encrypted_api_secret FROM users WHERE id = ?
    `).get(userId) as { encrypted_api_key?: string; encrypted_api_secret?: string } | undefined

        if (!user || !user.encrypted_api_key || !user.encrypted_api_secret) {
            return NextResponse.json({
                connected: false,
                message: 'No API credentials found',
            })
        }

        // Test connection - use config network setting
        try {
            const useTestnetNetwork = config.binance.network !== 'mainnet'
            const client = getBinanceClient(useTestnetNetwork)
            client.initialize(user.encrypted_api_key, user.encrypted_api_secret)
            const isConnected = await client.testConnection()

            return NextResponse.json({
                connected: isConnected,
                message: isConnected ? 'Connected to Binance' : 'Connection test failed',
            })
        } catch {
            return NextResponse.json({
                connected: false,
                message: 'Invalid credentials',
            })
        }
    } catch (error: any) {
        console.error('Connection status check error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
