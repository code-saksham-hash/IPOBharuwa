import { Queue } from 'bullmq'

const connectionOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}

let autoApplyQueue: Queue | null = null

export function getAutoApplyQueue(): Queue {
  if (!autoApplyQueue) {
    autoApplyQueue = new Queue('auto-apply', { connection: connectionOptions })
  }
  return autoApplyQueue
}
