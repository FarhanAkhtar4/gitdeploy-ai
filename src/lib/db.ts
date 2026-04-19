/**
 * Database client with dual-mode support:
 * - Local dev: SQLite via Prisma (file-based)
 * - Cloudflare/Edge: Turso via libSQL + Prisma adapter
 *
 * Turso provides Edge-compatible SQLite with:
 * - 9GB storage, 500 databases, 1B row reads (free tier)
 * - Embedded replicas for zero-latency reads
 * - Automatic backups
 */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''

  // Detect if using Turso/libSQL (starts with libsql:// or turso://)
  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('turso://')

  if (isTurso) {
    // Edge-compatible: Turso/libSQL via Prisma adapter
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
    })

    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter } as never)
  }

  // Local dev: Standard SQLite via Prisma
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
