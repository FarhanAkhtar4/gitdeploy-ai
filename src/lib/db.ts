/**
 * Database client with dual-mode support:
 * - Local dev: SQLite via Prisma (file-based)
 * - Cloudflare/Edge: Turso via libSQL + Prisma adapter
 *
 * IMPORTANT: Fully lazy initialization with ZERO top-level side effects.
 * No PrismaClient, no libsql client, no heavy module imports happen
 * until the first actual query is executed.
 *
 * This prevents ALL build-time errors:
 * - "LibsqlError: URL_INVALID: The URL 'undefined'" during `next build`
 * - Module evaluation errors when DATABASE_URL is not set
 */

type PrismaClientType = Record<string, unknown>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
  dbInitPromise: Promise<PrismaClientType> | undefined
}

/**
 * Creates a PrismaClient based on the current DATABASE_URL.
 * Uses dynamic imports to avoid ANY module-level side effects.
 */
async function createPrismaClient(): Promise<PrismaClientType> {
  const { PrismaClient } = await import('@prisma/client')

  const databaseUrl = process.env.DATABASE_URL || ''

  if (!databaseUrl) {
    return new PrismaClient()
  }

  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('turso://')

  if (isTurso) {
    const [{ PrismaLibSql }, { createClient }] = await Promise.all([
      import('@prisma/adapter-libsql'),
      import('@libsql/client'),
    ])

    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
    })

    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter } as never)
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

/**
 * Get or create the cached PrismaClient (singleton pattern).
 * Uses a shared promise to prevent race conditions.
 */
function getDb(): Promise<PrismaClientType> {
  if (globalForPrisma.prisma) {
    return Promise.resolve(globalForPrisma.prisma)
  }

  if (!globalForPrisma.dbInitPromise) {
    globalForPrisma.dbInitPromise = createPrismaClient().then((client) => {
      globalForPrisma.prisma = client
      return client
    })
  }

  return globalForPrisma.dbInitPromise
}

/**
 * Create a lazy proxy that defers all property access until the PrismaClient is ready.
 * Supports deep property chains like `db.user.findUnique({ where: { id } })`.
 */
function createLazyProxy(path: string[] = []): any {
  return new Proxy(() => {}, {
    // Property access: build up the path chain
    get(_target, prop, _receiver) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // Make the proxy thenable so `await db.xxx.yyy()` works
        // When awaited, we resolve the chain by executing on the real client
        return (resolve: any, reject: any) => {
          getDb()
            .then((client) => {
              let result = client
              for (const key of path) {
                result = result[key]
              }
              // If the final result is a function, it's already been called
              // If it's a value (like a model delegate), resolve it
              if (typeof result === 'function') {
                // This shouldn't happen in normal Prisma usage —
                // methods are always called with arguments
                resolve(result)
              } else {
                resolve(result)
              }
            })
            .catch(reject)
        }
      }
      // Continue building the property chain
      return createLazyProxy([...path, prop as string])
    },

    // Function call: execute the chain on the real client
    apply(_target, _thisArg, args) {
      return getDb().then((client) => {
        let result = client
        for (const key of path) {
          result = result[key]
        }
        if (typeof result === 'function') {
          return result(...args)
        }
        return result
      })
    },
  })
}

/**
 * Export a lazy proxy as the database client.
 *
 * Usage: `await db.user.findUnique({ where: { id: '123' } })`
 *
 * - No modules are imported at load time
 * - No connections are attempted at load time
 * - First actual query triggers dynamic import + PrismaClient creation
 * - Subsequent calls use the cached client
 */
export const db = createLazyProxy()
