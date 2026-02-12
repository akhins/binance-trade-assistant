import getDatabase from '@/lib/db/database'

/**
 * Initialize demo user
 */
export async function initializeDemoUser(): Promise<number> {
    const db = getDatabase()

    // Check if demo user exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('demo')

    if (existing) {
        return (existing as { id: number }).id
    }

    // Create demo user
    const result = db.prepare(`
    INSERT INTO users (username)
    VALUES ('demo')
  `).run()

    return result.lastInsertRowid as number
}

/**
 * Get demo user ID
 */
export function getDemoUserId(): number {
    const db = getDatabase()
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get('demo')

    if (!user) {
        return initializeDemoUser() as unknown as number
    }

    return (user as { id: number }).id
}

// Auto-initialize on import
if (typeof window === 'undefined') {
    // Server-side only
    initializeDemoUser().catch(console.error)
}
