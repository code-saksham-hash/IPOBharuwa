import cron from 'node-cron'
import { pollOpenIPOs } from './jobs/pollOpenIPOs'
import { checkResults } from './jobs/checkResults'

export function startScheduler(): void {
  cron.schedule('0 */4 * * *', () => {
    console.log('[scheduler] [cron]  Running pollOpenIPOs')
    pollOpenIPOs().catch((err) =>
      console.error('[scheduler] pollOpenIPOs error:', err instanceof Error ? err.message : err),
    )
  })

  cron.schedule('0 */6 * * *', () => {
    console.log('[scheduler] [cron]  Running checkResults')
    checkResults().catch((err) =>
      console.error('[scheduler] checkResults error:', err instanceof Error ? err.message : err),
    )
  })

  console.log('[scheduler] [Y]  Started — pollOpenIPOs: every 4h, checkResults: every 6h')
}
