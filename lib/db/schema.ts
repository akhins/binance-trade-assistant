// Database type definitions

export interface User {
    id: number
    username: string
    encrypted_api_key?: string
    encrypted_api_secret?: string
    auto_sync_enabled?: number // 0 or 1
    auto_sync_interval?: number // minutes
    auto_ai_analysis?: number // 0 or 1
    last_sync_at?: string
    created_at: string
    updated_at: string
}

export interface Trade {
    id: number
    user_id: number
    // Binance data
    binance_order_id?: string
    symbol: string
    side: 'BUY' | 'SELL'
    type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT'
    quantity: number
    price: number
    executed_qty: number
    commission: number
    commission_asset: string
    // Trade tracking
    entry_price?: number
    exit_price?: number
    stop_loss?: number
    take_profit?: number
    leverage?: number
    position_size_usdt: number
    pnl: number
    pnl_percentage: number
    status: 'OPEN' | 'CLOSED' | 'CANCELLED'
    // Timestamps
    opened_at: string
    closed_at?: string
    created_at: string
    updated_at: string
}

export interface TradeNote {
    id: number
    trade_id: number
    note?: string
    tags?: string // JSON array of tags
    setup?: string
    timeframe?: string
    error_type?: string
    screenshot_url?: string
    tradingview_link?: string
    created_at: string
    updated_at: string
}

export interface RiskRule {
    id: number
    user_id: number
    rule_type: 'DAILY_LOSS' | 'WEEKLY_LOSS' | 'MAX_TRADES' | 'CONSECUTIVE_LOSSES'
    limit_value: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface RuleViolation {
    id: number
    user_id: number
    rule_id: number
    violation_date: string
    current_value: number
    limit_value: number
    description: string
    created_at: string
}

export interface AIInsight {
    id: number
    user_id: number
    trade_id?: number
    insight_type: 'TRADE_SUMMARY' | 'PATTERN_DETECTION' | 'WEEKLY_REPORT'
    content: string // JSON with structured data
    created_at: string
}

export interface PerformanceMetric {
    id: number
    user_id: number
    metric_date: string
    total_trades: number
    winning_trades: number
    losing_trades: number
    win_rate: number
    total_pnl: number
    profit_factor: number
    expectancy: number
    max_drawdown: number
    average_win: number
    average_loss: number
    largest_win: number
    largest_loss: number
    created_at: string
}

// Request/Response types
export interface CreateTradeNoteRequest {
    trade_id: number
    note?: string
    tags?: string[]
    setup?: string
    timeframe?: string
    error_type?: string
    screenshot_url?: string
    tradingview_link?: string
}

export interface TradeWithNotes extends Trade {
    notes?: TradeNote
}

export interface DashboardMetrics {
    totalPnL: number
    winRate: number
    profitFactor: number
    expectancy: number
    maxDrawdown: number
    totalTrades: number
    todayPnL: number
    weekPnL: number
    monthPnL: number
}
