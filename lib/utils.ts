import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number, currency: string = 'USDT'): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)} ${currency}`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

/**
 * Format large numbers with K, M suffix
 */
export function formatCompactNumber(value: number): string {
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`
    }
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)}K`
    }
    return value.toFixed(2)
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

/**
 * Generate random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T
    } catch {
        return fallback
    }
}
