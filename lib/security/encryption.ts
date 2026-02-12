import CryptoJS from 'crypto-js'
import { config } from '../config'

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
    try {
        const encrypted = CryptoJS.AES.encrypt(text, config.security.encryptionSecret)
        return encrypted.toString()
    } catch (error) {
        console.error('Encryption failed:', error)
        throw new Error('Failed to encrypt data')
    }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, config.security.encryptionSecret)
        return decrypted.toString(CryptoJS.enc.Utf8)
    } catch (error) {
        console.error('Decryption failed:', error)
        throw new Error('Failed to decrypt data')
    }
}

/**
 * Hash data (one-way)
 */
export function hash(text: string): string {
    return CryptoJS.SHA256(text).toString()
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
    // Binance API keys are typically 64 characters
    return typeof apiKey === 'string' && apiKey.length === 64
}

/**
 * Validate API secret format
 */
export function validateApiSecret(apiSecret: string): boolean {
    // Binance API secrets are typically 64 characters
    return typeof apiSecret === 'string' && apiSecret.length === 64
}

/**
 * Sanitize API credentials for logging (show only first/last 4 chars)
 */
export function sanitizeForLog(credential: string): string {
    if (credential.length <= 8) return '****'
    return `${credential.slice(0, 4)}...${credential.slice(-4)}`
}
