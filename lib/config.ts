// Application configuration

export const config = {
    // Binance API
    binance: {
        testnet: {
            apiUrl: process.env.BINANCE_API_URL || 'https://testnet.binance.vision',
            wsUrl: process.env.BINANCE_WS_URL || 'wss://testnet.binance.vision/ws',
        },
        mainnet: {
            apiUrl: 'https://api.binance.com/api',
            wsUrl: 'wss://stream.binance.com:9443/ws',
        },
        rateLimit: {
            requestsPerMinute: 1200,
            ordersPerSecond: 10,
            ordersPerDay: 200000,
        },
    },

    // Database
    database: {
        path: process.env.DATABASE_PATH || './data/trades.db',
    },

    // AI Configuration
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash',
        maxTokens: 2048,
    },

    // Security
    security: {
        encryptionSecret: process.env.ENCRYPTION_SECRET || 'default-secret-change-me',
    },

    // App Settings
    app: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        name: 'Binance Trade Asistanı',
        version: '0.1.0',
    },

    // Risk Management Defaults
    risk: {
        defaultMaxDailyLoss: 100, // USDT
        defaultMaxWeeklyLoss: 500, // USDT
        defaultMaxConsecutiveLosses: 3,
        defaultMaxDailyTrades: 10,
    },

    // Trade Journal
    journal: {
        maxNoteLength: 2000,
        maxTagsPerTrade: 10,
        availableSetups: [
            'Breakout',
            'Support/Resistance',
            'Trend Following',
            'Mean Reversion',
            'Scalp',
            'Swing',
            'Other',
        ],
        availableTimeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1D'],
        availableErrorTypes: [
            'FOMO',
            'Revenge Trading',
            'No Stop Loss',
            'Too Large Position',
            'Against Trend',
            'Poor Entry',
            'Poor Exit',
            'Emotional',
            'None',
        ],
    },
} as const

export type Config = typeof config
