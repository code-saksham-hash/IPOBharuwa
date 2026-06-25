import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '../../.env') })

import { Worker } from 'bullmq'
import { connectionOptions, redis } from './connection'
import { autoApply } from './jobs/autoApply'
import { startScheduler } from './scheduler'

async function main() {
  console.log('[worker] [start]  Starting IPOBaje worker...')

  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    console.error('[worker] [N]  ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    console.error('   Generate with: openssl rand -hex 32')
    process.exit(1)
  }
  console.log('[worker] [Y]  Encryption key validated')

  try {
    await redis.ping()
    console.log('[worker] [Y]  Redis connected')
  } catch (err) {
    console.error('[worker] [N]  Redis connection failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const applyWorker = new Worker('auto-apply', autoApply, {
    connection: connectionOptions,
    concurrency: 3,
    limiter: {
      max: 3,
      duration: 30_000,
    },
  })

  applyWorker.on('completed', (job) => {
    console.log(`[worker] [Y]  Job ${job.id} completed`)
  })

  applyWorker.on('failed', (job, err) => {
    console.error(`[worker] [N]  Job ${job?.id} failed:`, err.message)
  })

  console.log('[worker] [Y]  Auto-apply worker started (concurrency: 3, retries: 3)')

  startScheduler()

  console.log('[worker] [on]  All systems running')

  process.on('SIGTERM', async () => {
    console.log('[worker] [stop]  Shutting down...')
    await applyWorker.close()
    redis.disconnect()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('[worker] [stop]  Shutting down...')
    await applyWorker.close()
    redis.disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('[worker] [N]  Fatal error:', err)
  process.exit(1)
})
