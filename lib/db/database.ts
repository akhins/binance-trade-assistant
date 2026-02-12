import * as fs from 'fs'
import * as path from 'path'
import type { User, Trade, TradeNote, RiskRule, RuleViolation, AIInsight, PerformanceMetric } from './schema'

interface Database {
  users: User[]
  trades: Trade[]
  trade_notes: TradeNote[]
  risk_rules: RiskRule[]
  rule_violations: RuleViolation[]
  ai_insights: AIInsight[]
  performance_metrics: PerformanceMetric[]
}

let dbPath: string
let db: Database | null = null

/**
 * Initialize JSON database
 */
export function getDatabase(): any {
  if (db) return createQueryInterface()

  // Ensure data directory exists
  dbPath = path.join(process.cwd(), 'data', 'db.json')
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Load or create database
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf-8')
    db = JSON.parse(data)
  } else {
    db = {
      users: [],
      trades: [],
      trade_notes: [],
      risk_rules: [],
      rule_violations: [],
      ai_insights: [],
      performance_metrics: [],
    }
    saveDatabase()
  }

  // Initialize demo user if not exists
  if (db!.users.length === 0) {
    db!.users.push({
      id: 1,
      username: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User)
    saveDatabase()
  }

  return createQueryInterface()
}

/**
 * Save database to disk
 */
function saveDatabase() {
  if (!db || !dbPath) return
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save database:', error)
  }
}

/**
 * Create SQLite-like query interface
 */
function createQueryInterface() {
  return {
    prepare: (sql: string) => ({
      run: (...params: any[]) => {
        const result = executeSQL(sql, params, 'run')
        saveDatabase()
        return result
      },
      get: (...params: any[]) => executeSQL(sql, params, 'get'),
      all: (...params: any[]) => executeSQL(sql, params, 'all'),
    }),
    exec: (sql: string) => {
      // For CREATE TABLE statements, we just ignore them since we use JSON
      console.log('exec (ignored):', sql.substring(0, 50))
    },
    pragma: (pragma: string) => {
      // Ignore pragma statements
      console.log('pragma (ignored):', pragma)
    },
    close: () => {
      saveDatabase()
      db = null
    },
  }
}

/**
 * Simple SQL parser and executor (very basic implementation)
 */
function executeSQL(sql: string, params: any[], type: 'run' | 'get' | 'all'): any {
  if (!db) throw new Error('Database not initialized')

  const sqlLower = sql.toLowerCase().trim()

  // INSERT
  if (sqlLower.startsWith('insert into')) {
    const match = sql.match(/insert into (\w+)/i)
    if (!match) throw new Error('Invalid INSERT')

    const table = match[1] as keyof Database
    const values = parseInsertValues(sql, params)

    const id = (db[table] as any[]).length > 0
      ? Math.max(...(db[table] as any[]).map((r: any) => r.id || 0)) + 1
      : 1

    const record = { id, ...values, created_at: values.created_at || new Date().toISOString() }
      ; (db[table] as any[]).push(record)

    return { lastInsertRowid: id, changes: 1 }
  }

  // SELECT
  if (sqlLower.startsWith('select')) {
    const match = sql.match(/from (\w+)/i)
    if (!match) throw new Error('Invalid SELECT')

    const table = match[1] as keyof Database
    let results = [...(db[table] as any[])]

    // Simple WHERE clause parsing
    const whereMatch = sql.match(/where ([^\n]+?)(?:order by|limit|$)/i)
    if (whereMatch) {
      results = filterByWhere(results, whereMatch[1], params)
    }

    // Check for aggregate SELECT (SUM, COUNT, AVG, COALESCE)
    const aggregateMatch = sql.match(/select\s+(.+?)\s+from/i)
    if (aggregateMatch && (sqlLower.includes('sum(') || sqlLower.includes('count(') || sqlLower.includes('avg(') || sqlLower.includes('coalesce('))) {
      const selectPart = aggregateMatch[1]
      const aliasMatch = selectPart.match(/as\s+(\w+)/i)
      const alias = aliasMatch ? aliasMatch[1] : 'value'

      let value: number
      if (sqlLower.includes('sum(')) {
        const fieldMatch = sql.match(/sum\s*\(\s*(\w+)\s*\)/i)
        const field = fieldMatch ? fieldMatch[1] : 'pnl'
        value = results.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0)
      } else if (sqlLower.includes('count(')) {
        value = results.length
      } else if (sqlLower.includes('avg(')) {
        const fieldMatch = sql.match(/avg\s*\(\s*(\w+)\s*\)/i)
        const field = fieldMatch ? fieldMatch[1] : 'pnl'
        value = results.length > 0
          ? results.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0) / results.length
          : 0
      } else if (sqlLower.includes('coalesce(')) {
        const sumMatch = sql.match(/coalesce\s*\(\s*sum\s*\(\s*(\w+)\s*\)\s*,\s*(\d+)\s*\)/i)
        if (sumMatch) {
          const field = sumMatch[1]
          const defaultValue = parseInt(sumMatch[2]) || 0
          const sum = results.reduce((s: number, r: any) => s + (Number(r[field]) || 0), 0)
          value = results.length > 0 ? sum : defaultValue
        } else {
          value = 0
        }
      } else {
        value = 0
      }

      const aggResult = { [alias]: value }
      return type === 'get' ? aggResult : (type === 'all' ? [aggResult] : [aggResult])
    }

    // ORDER BY
    const orderMatch = sql.match(/order by\s+(\w+\.)?(\w+)\s+(asc|desc)/i)
    if (orderMatch) {
      const field = orderMatch[2]
      const direction = orderMatch[3]
      results.sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        if (direction.toLowerCase() === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }

    // LIMIT
    const limitMatch = sql.match(/limit (\d+)/i)
    if (limitMatch) {
      results = results.slice(0, parseInt(limitMatch[1]))
    }

    return type === 'get' ? results[0] : (type === 'all' ? results : results)
  }

  // UPDATE
  if (sqlLower.startsWith('update')) {
    const match = sql.match(/update (\w+)/i)
    if (!match) throw new Error('Invalid UPDATE')

    const table = match[1] as keyof Database
    const whereMatch = sql.match(/where (.+)$/i)
    const { updates, whereParams } = parseUpdateSet(sql, params)

    let updated = 0
      ; (db[table] as any[]).forEach((record: any) => {
        if (!whereMatch || matchesWhere(record, whereMatch[1], whereParams)) {
          Object.assign(record, updates, { updated_at: new Date().toISOString() })
          updated++
        }
      })

    return { changes: updated }
  }

  // DELETE (if needed)
  if (sqlLower.startsWith('delete from')) {
    const match = sql.match(/delete from (\w+)/i)
    if (!match) throw new Error('Invalid DELETE')

    const table = match[1] as keyof Database
    const whereMatch = sql.match(/where (.+)$/i)

    const filtered = (db[table] as any[]).filter((record: any) => {
      return !(whereMatch && matchesWhere(record, whereMatch[1], params))
    })

    const deleted = (db[table] as any[]).length - filtered.length
      ; (db[table] as any) = filtered

    return { changes: deleted }
  }

  throw new Error(`Unsupported SQL: ${sql.substring(0, 50)}`)
}

/**
 * Parse INSERT VALUES
 */
function parseInsertValues(sql: string, params: any[]): any {
  const match = sql.match(/\(([^)]+)\) values/i)
  if (!match) return {}

  const fields = match[1].split(',').map(f => f.trim())
  const values: any = {}

  fields.forEach((field, i) => {
    values[field] = params[i]
  })

  return values
}

/**
 * Parse UPDATE SET - returns updates object and remaining params for WHERE
 */
function parseUpdateSet(sql: string, params: any[]): { updates: Record<string, any>; whereParams: any[] } {
  const match = sql.match(/set (.+?) where/i)
  if (!match) return { updates: {}, whereParams: params }

  const setParts = match[1].split(',')
  const updates: Record<string, any> = {}
  let paramIndex = 0

  setParts.forEach(part => {
    const trimmed = part.trim()
    const eqIndex = trimmed.indexOf('=')
    const field = trimmed.substring(0, eqIndex).trim()
    const valuePart = trimmed.substring(eqIndex + 1).trim().toUpperCase()

    if (valuePart === 'CURRENT_TIMESTAMP' || valuePart === "CURRENT_TIMESTAMP") {
      updates[field] = new Date().toISOString()
    } else if (valuePart === '?') {
      updates[field] = params[paramIndex++]
    }
  })

  const whereParams = params.slice(paramIndex)
  return { updates, whereParams }
}

/**
 * Filter by WHERE clause
 */
function filterByWhere(results: any[], where: string, params: any[]): any[] {
  return results.filter(record => matchesWhere(record, where, params))
}

/**
 * Check if record matches WHERE clause
 */
function matchesWhere(record: any, where: string, params: any[]): boolean {
  let paramIndex = 0

  // Split by AND
  const conditions = where.split(/\s+and\s+/i)

  return conditions.every(condition => {
    const trimmed = condition.trim()
    // Match field op ? (parameter)
    const paramMatch = trimmed.match(/(\w+)\s*(=|!=|>|<|>=|<=|IS|IS NOT)\s*\?/i)
    if (paramMatch) {
      const [, field, operator] = paramMatch
      const value = params[paramIndex++]
      switch (operator?.toUpperCase()) {
        case '=': return record[field] == value
        case '!=': return record[field] != value
        case '>': return record[field] > value
        case '<': return record[field] < value
        case '>=': return record[field] >= value
        case '<=': return record[field] <= value
        default: return true
      }
    }
    // Match field = 'literal' or field = "literal"
    const literalMatch = trimmed.match(/(\w+)\s*=\s*['"]([^'"]*)['"]/i)
    if (literalMatch) {
      const [, field, literalValue] = literalMatch
      return String(record[field]) === literalValue
    }
    // Match field = number
    const numMatch = trimmed.match(/(\w+)\s*=\s*(\d+)/i)
    if (numMatch) {
      const [, field, numValue] = numMatch
      return Number(record[field]) === Number(numValue)
    }
    return true
  })
}

export function closeDatabase() {
  saveDatabase()
  db = null
}

export default getDatabase
