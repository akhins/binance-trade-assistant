import getDatabase from '../db/database'
import type { RiskRule, Trade, RuleViolation } from '../db/schema'
import { startOfDay, startOfWeek, endOfDay } from 'date-fns'

/**
 * Check daily loss limit
 */
export function checkDailyLoss(userId: number, maxLoss: number): {
    violated: boolean
    currentValue: number
    limitValue: number
    description: string
} {
    const db = getDatabase()
    const today = startOfDay(new Date()).toISOString()
    const endToday = endOfDay(new Date()).toISOString()

    const result = db.prepare(`
    SELECT COALESCE(SUM(pnl), 0) as daily_pnl
    FROM trades
    WHERE user_id = ? 
    AND closed_at >= ? 
    AND closed_at <= ?
    AND status = 'CLOSED'
  `).get(userId, today, endToday) as { daily_pnl: number }

    const dailyPnL = result.daily_pnl
    const violated = dailyPnL < -Math.abs(maxLoss)

    return {
        violated,
        currentValue: Math.abs(dailyPnL),
        limitValue: Math.abs(maxLoss),
        description: violated
            ? `Daily loss limit exceeded: ${dailyPnL.toFixed(2)} USDT (limit: -${maxLoss} USDT)`
            : `Daily PnL: ${dailyPnL.toFixed(2)} USDT`,
    }
}

/**
 * Check weekly loss limit
 */
export function checkWeeklyLoss(userId: number, maxLoss: number): {
    violated: boolean
    currentValue: number
    limitValue: number
    description: string
} {
    const db = getDatabase()
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

    const result = db.prepare(`
    SELECT COALESCE(SUM(pnl), 0) as weekly_pnl
    FROM trades
    WHERE user_id = ? 
    AND closed_at >= ?
    AND status = 'CLOSED'
  `).get(userId, weekStart) as { weekly_pnl: number }

    const weeklyPnL = result.weekly_pnl
    const violated = weeklyPnL < -Math.abs(maxLoss)

    return {
        violated,
        currentValue: Math.abs(weeklyPnL),
        limitValue: Math.abs(maxLoss),
        description: violated
            ? `Weekly loss limit exceeded: ${weeklyPnL.toFixed(2)} USDT (limit: -${maxLoss} USDT)`
            : `Weekly PnL: ${weeklyPnL.toFixed(2)} USDT`,
    }
}

/**
 * Check max trades limit
 */
export function checkMaxTrades(userId: number, maxTrades: number, period: 'daily' | 'weekly' = 'daily'): {
    violated: boolean
    currentValue: number
    limitValue: number
    description: string
} {
    const db = getDatabase()
    const startDate = period === 'daily'
        ? startOfDay(new Date()).toISOString()
        : startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

    const result = db.prepare(`
    SELECT COUNT(*) as trade_count
    FROM trades
    WHERE user_id = ? 
    AND opened_at >= ?
  `).get(userId, startDate) as { trade_count: number }

    const tradeCount = result.trade_count
    const violated = tradeCount >= maxTrades

    return {
        violated,
        currentValue: tradeCount,
        limitValue: maxTrades,
        description: violated
            ? `${period === 'daily' ? 'Daily' : 'Weekly'} trade limit reached: ${tradeCount}/${maxTrades}`
            : `${period === 'daily' ? 'Today' : 'This week'}: ${tradeCount}/${maxTrades} trades`,
    }
}

/**
 * Check consecutive losses
 */
export function checkConsecutiveLosses(userId: number, maxConsecutive: number): {
    violated: boolean
    currentValue: number
    limitValue: number
    description: string
} {
    const db = getDatabase()

    // Get recent closed trades
    const recentTrades = db.prepare(`
    SELECT pnl
    FROM trades
    WHERE user_id = ? AND status = 'CLOSED'
    ORDER BY closed_at DESC
    LIMIT 20
  `).all(userId) as { pnl: number }[]

    let consecutiveLosses = 0

    for (const trade of recentTrades) {
        if (trade.pnl < 0) {
            consecutiveLosses++
        } else {
            break // Stop at first win
        }
    }

    const violated = consecutiveLosses >= maxConsecutive

    return {
        violated,
        currentValue: consecutiveLosses,
        limitValue: maxConsecutive,
        description: violated
            ? `Consecutive loss limit reached: ${consecutiveLosses} losses in a row`
            : consecutiveLosses > 0
                ? `Current streak: ${consecutiveLosses} consecutive losses`
                : 'No consecutive losses',
    }
}

/**
 * Check all active risk rules for a user
 */
export function checkAllRiskRules(userId: number): {
    canTrade: boolean
    violations: Array<{
        ruleType: string
        violated: boolean
        currentValue: number
        limitValue: number
        description: string
    }>
    warnings: string[]
} {
    const db = getDatabase()

    // Get all active rules
    const rules = db.prepare(`
    SELECT * FROM risk_rules
    WHERE user_id = ? AND is_active = 1
  `).all(userId) as RiskRule[]

    const violations: any[] = []
    const warnings: string[] = []
    let canTrade = true

    for (const rule of rules) {
        let check: any

        switch (rule.rule_type) {
            case 'DAILY_LOSS':
                check = checkDailyLoss(userId, rule.limit_value)
                break
            case 'WEEKLY_LOSS':
                check = checkWeeklyLoss(userId, rule.limit_value)
                break
            case 'MAX_TRADES':
                check = checkMaxTrades(userId, rule.limit_value, 'daily')
                break
            case 'CONSECUTIVE_LOSSES':
                check = checkConsecutiveLosses(userId, rule.limit_value)
                break
            default:
                continue
        }

        violations.push({
            ruleType: rule.rule_type,
            ...check,
        })

        if (check.violated) {
            canTrade = false

            // Log violation
            db.prepare(`
        INSERT INTO rule_violations (user_id, rule_id, violation_date, current_value, limit_value, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                userId,
                rule.id,
                new Date().toISOString(),
                check.currentValue,
                check.limitValue,
                check.description
            )
        } else if (check.currentValue / check.limitValue >= 0.8) {
            // Warning when 80% of limit reached
            warnings.push(`⚠️ ${check.description} - Near limit!`)
        }
    }

    return { canTrade, violations, warnings }
}

/**
 * Get or create risk rules for user
 */
export function getRiskRules(userId: number): RiskRule[] {
    const db = getDatabase()

    let rules = db.prepare(`
    SELECT * FROM risk_rules WHERE user_id = ?
  `).all(userId) as RiskRule[]

    // Create default rules if none exist
    if (rules.length === 0) {
        const defaultRules = [
            { type: 'DAILY_LOSS', value: 100 },
            { type: 'WEEKLY_LOSS', value: 500 },
            { type: 'MAX_TRADES', value: 10 },
            { type: 'CONSECUTIVE_LOSSES', value: 3 },
        ]

        for (const rule of defaultRules) {
            db.prepare(`
        INSERT INTO risk_rules (user_id, rule_type, limit_value, is_active)
        VALUES (?, ?, ?, 1)
      `).run(userId, rule.type, rule.value)
        }

        rules = db.prepare(`
      SELECT * FROM risk_rules WHERE user_id = ?
    `).all(userId) as RiskRule[]
    }

    return rules
}

/**
 * Update risk rule
 */
export function updateRiskRule(
    ruleId: number,
    userId: number,
    limitValue?: number,
    isActive?: boolean
): boolean {
    const db = getDatabase()

    const updates: string[] = []
    const values: any[] = []

    if (limitValue !== undefined) {
        updates.push('limit_value = ?')
        values.push(limitValue)
    }

    if (isActive !== undefined) {
        updates.push('is_active = ?')
        values.push(isActive ? 1 : 0)
    }

    if (updates.length === 0) return false

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(ruleId, userId)

    const result = db.prepare(`
    UPDATE risk_rules
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `).run(...values)

    return result.changes > 0
}

/**
 * Should block trade (discipline mode)
 */
export function shouldBlockTrade(userId: number): {
    blocked: boolean
    reason?: string
} {
    const { canTrade, violations } = checkAllRiskRules(userId)

    if (!canTrade) {
        const violatedRules = violations
            .filter(v => v.violated)
            .map(v => v.description)
            .join('; ')

        return {
            blocked: true,
            reason: `Trading blocked due to risk rule violations: ${violatedRules}`,
        }
    }

    return { blocked: false }
}
