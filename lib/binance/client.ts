import Binance, { OrderSide, OrderType } from 'binance-api-node'
import { config } from '../config'
import { decrypt } from '../security/encryption'
import { sleep } from '../utils'

/**
 * Rate limiter for Binance API
 */
class RateLimiter {
    private requests: number[] = []
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    async waitIfNeeded(): Promise<void> {
        const now = Date.now()

        // Remove old requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs)

        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0]
            const waitTime = this.windowMs - (now - oldestRequest) + 100 // Add 100ms buffer

            if (waitTime > 0) {
                await sleep(waitTime)
                // Recursively check again
                return this.waitIfNeeded()
            }
        }

        this.requests.push(now)
    }
}

/**
 * Binance API Client with rate limiting and retry logic
 */
export class BinanceClient {
    private client: ReturnType<typeof Binance> | null = null
    private rateLimiter: RateLimiter
    private useTestnet: boolean

    constructor(useTestnet: boolean = true) {
        this.useTestnet = useTestnet
        // Rate limiter: 1200 requests per minute
        this.rateLimiter = new RateLimiter(
            config.binance.rateLimit.requestsPerMinute,
            60000 // 1 minute
        )
    }

    /**
     * Initialize client with encrypted API credentials
     */
    initialize(encryptedApiKey: string, encryptedApiSecret: string): void {
        try {
            const apiKey = decrypt(encryptedApiKey)
            const apiSecret = decrypt(encryptedApiSecret)

            const options: any = {
                apiKey,
                apiSecret,
            }

            if (this.useTestnet) {
                options.httpBase = config.binance.testnet.apiUrl
                options.wsBase = config.binance.testnet.wsUrl
            }

            this.client = Binance(options)
        } catch (error) {
            console.error('Failed to initialize Binance client:', error)
            throw new Error('Invalid API credentials')
        }
    }

    /**
     * Check if client is initialized
     */
    isInitialized(): boolean {
        return this.client !== null
    }

    /**
     * Execute API request with rate limiting and retry logic
     */
    private async executeWithRetry<T>(
        apiCall: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Wait for rate limiter
                await this.rateLimiter.waitIfNeeded()

                // Execute API call
                return await apiCall()
            } catch (error: any) {
                lastError = error

                // Check if error is rate limit (429)
                if (error.code === -1003 || error.statusCode === 429) {
                    const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
                    console.warn(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`)
                    await sleep(delay)
                    continue
                }

                // Check if error is network-related
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                    const delay = baseDelay * Math.pow(2, attempt)
                    console.warn(`Network error, retrying in ${delay}ms (${attempt + 1}/${maxRetries})`)
                    await sleep(delay)
                    continue
                }

                // For other errors, throw immediately
                throw error
            }
        }

        throw lastError || new Error('Max retries exceeded')
    }

    /**
     * Test connection
     */
    async testConnection(): Promise<boolean> {
        if (!this.client) throw new Error('Client not initialized')

        try {
            await this.executeWithRetry(() => this.client!.ping())
            return true
        } catch (error) {
            console.error('Connection test failed:', error)
            return false
        }
    }

    /**
     * Get account information
     */
    async getAccountInfo() {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() => this.client!.accountInfo())
    }

    /**
     * Get all trades for a symbol
     */
    async getMyTrades(symbol: string, limit: number = 500) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.myTrades({ symbol, limit })
        )
    }

    /**
     * Get all orders for a symbol
     */
    async getAllOrders(symbol: string, limit: number = 500) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.allOrders({ symbol, limit })
        )
    }

    /**
     * Get open orders
     */
    async getOpenOrders(symbol?: string) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.openOrders({ symbol })
        )
    }

    /**
     * Get order book
     */
    async getOrderBook(symbol: string, limit: number = 100) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.book({ symbol, limit })
        )
    }

    /**
     * Get ticker price
     */
    async getPrice(symbol?: string) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.prices(symbol ? { symbol } : undefined)
        )
    }

    /**
     * Get 24hr ticker statistics
     */
    async get24hrStats(symbol?: string) {
        if (!this.client) throw new Error('Client not initialized')

        return this.executeWithRetry(() =>
            this.client!.dailyStats(symbol ? { symbol } : undefined)
        )
    }
}

// Singleton instance
let binanceClient: BinanceClient | null = null

/**
 * Get Binance client instance
 */
export function getBinanceClient(useTestnet: boolean = true): BinanceClient {
    if (!binanceClient) {
        binanceClient = new BinanceClient(useTestnet)
    }
    return binanceClient
}

export default BinanceClient
