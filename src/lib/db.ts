/**
 * Database client with dual-mode support:
 * - Local dev: SQLite via Prisma (file-based)
 * - Cloudflare/Edge: Turso via libSQL + Prisma adapter
 *
 * IMPORTANT: Uses lazy initialization to avoid connecting during build time
 * when DATABASE_URL environment variable is not available.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Lazily creates or returns the cached PrismaClient.
 * This ensures we never try to connect during build time
 * when env vars like DATABASE_URL are not available.
 */
function getDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const databaseUrl = process.env.DATABASE_URL || ''

  // Detect if using Turso/libSQL (starts with libsql:// or turso://)
  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('turso://')

  let client: PrismaClient

  if (isTurso) {
    // Edge-compatible: Turso/libSQL via Prisma adapter
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
    })

    const adapter = new PrismaLibSql(libsql)
    client = new PrismaClient({ adapter } as never)
  } else if (databaseUrl.startsWith('file:')) {
    // Local dev: Standard SQLite via Prisma
    client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  } else {
    // Fallback: No valid DATABASE_URL — use empty/minimal client
    // This happens during build time; queries will fail gracefully
    client = new PrismaClient()
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

/**
 * Export a Proxy that lazily initializes the PrismaClient on first property access.
 * This prevents build-time connection errors when DATABASE_URL is undefined.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
