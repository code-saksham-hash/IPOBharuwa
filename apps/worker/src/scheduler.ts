import cron from 'node-cron'
import { pollOpenIPOs } from './jobs/pollOpenIPOs'
import { checkResults } from './jobs/checkResults'
import { checkPublicIssueList } from './jobs/checkPublicIssueList'

export function startScheduler(): void {
  // Run once immediately on boot so data isn't stuck empty until the first
  // cron tick (e.g. right after `pnpm dev` starts or a fresh deploy).
  pollOpenIPOs().catch((err) =>
    console.error('[scheduler] Initial pollOpenIPOs error:', err instanceof Error ? err.message : err),
  )
  checkPublicIssueList().catch((err) =>
    console.error('[scheduler] Initial checkPublicIssueList error:', err instanceof Error ? err.message : err),
  )

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

  // cdsc.com.np/ipolist is a plain public page with no auth/WAF concerns, so it's
  // safe to check far more often than the blocked MeroShare discovery endpoint.
  cron.schedule('0 * * * *', () => {
    console.log('[scheduler] [cron]  Running checkPublicIssueList')
    checkPublicIssueList().catch((err) =>
      console.error('[scheduler] checkPublicIssueList error:', err instanceof Error ? err.message : err),
    )
  })

  console.log('[scheduler] [Y]  Started — pollOpenIPOs: now + every 4h, checkResults: every 6h, checkPublicIssueList: now + hourly')
}
