import { prisma } from '@ipobaje/db'
import { MeroShareClient } from '@ipobaje/meroshare-client'
import { decrypt } from '../crypto'
import { createNotification } from '../services/notification'
import { Queue } from 'bullmq'
import { connectionOptions } from '../connection'

let autoApplyQueue: Queue | null = null

function getAutoApplyQueue(): Queue {
  if (!autoApplyQueue) {
    autoApplyQueue = new Queue('auto-apply', { connection: connectionOptions })
  }
  return autoApplyQueue
}

export async function pollOpenIPOs(): Promise<void> {
  console.log('[pollOpenIPOs] [lookup]  Checking for open IPOs...')

  try {
    const candidates = await prisma.meroShareAccount.findMany({
      where: { isActive: true },
    })

    if (candidates.length === 0) {
      console.log('[pollOpenIPOs] [warn]  No active accounts — skipping')
      return
    }

    // A single account with a stale/wrong password shouldn't block issue
    // discovery for everyone else — try each active account until one logs in.
    let client: MeroShareClient | null = null
    for (const candidate of candidates) {
      try {
        const password = decrypt({
          cipher: candidate.encryptedPassword,
          iv: candidate.encryptionIv,
          tag: candidate.encryptionTag,
        })
        const attempt = new MeroShareClient()
        await attempt.login(candidate.dpId, candidate.username || candidate.boid, password)
        client = attempt
        console.log(`[pollOpenIPOs] [Y]  Authenticated with account ${candidate.boid.slice(-6)}`)
        break
      } catch (err) {
        console.warn(
          `[pollOpenIPOs] [warn]  Login failed for account ${candidate.boid.slice(-6)}, trying next:`,
          err instanceof Error ? err.message : err,
        )
      }
    }

    if (!client) {
      console.error('[pollOpenIPOs] [N]  All active accounts failed to authenticate — skipping this cycle')
      return
    }

    const issues = await client.getCurrentIssues()
    console.log(`[pollOpenIPOs] [info]  Found ${issues.length} current issue(s)`)

    for (const issue of issues) {
      await prisma.iPOIssue.upsert({
        where: { companyShareId: issue.companyShareId },
        create: {
          companyShareId: issue.companyShareId,
          scrip: issue.scrip,
          companyName: issue.companyName,
          shareType: issue.shareTypeName,
          shareGroup: issue.shareGroupName,
          status: issue.statusName === 'OPEN' ? 'OPEN' : 'CLOSED',
          openDate: new Date(issue.openDate),
          closeDate: new Date(issue.closeDate),
          issuePrice: issue.issuePrice,
          minUnit: issue.minUnit,
          maxUnit: issue.maxUnit,
        },
        update: {
          status: issue.statusName === 'OPEN' ? 'OPEN' : 'CLOSED',
          closeDate: new Date(issue.closeDate),
        },
      })
    }

    const allAccounts = await prisma.meroShareAccount.findMany({
      where: { isActive: true },
      include: { user: true },
    })

    const openIssues = await prisma.iPOIssue.findMany({
      where: { status: 'OPEN' },
    })

    let enqueued = 0

    for (const openIssue of openIssues) {
      for (const acct of allAccounts) {
        const existing = await prisma.iPOApplication.findUnique({
          where: {
            accountId_issueId: {
              accountId: acct.id,
              issueId: openIssue.id,
            },
          },
        })

        if (existing) continue

        const app = await prisma.iPOApplication.create({
          data: {
            accountId: acct.id,
            issueId: openIssue.id,
            appliedKitta: openIssue.minUnit,
            status: 'PENDING',
          },
        })

        await getAutoApplyQueue().add('auto-apply', {
          applicationId: app.id,
          accountId: acct.id,
          issueId: openIssue.id,
        })

        await createNotification({
          userId: acct.userId,
          type: 'NEW_IPO_OPEN',
          title: `New IPO: ${openIssue.scrip}`,
          body: `${openIssue.companyName} is open. Min ${openIssue.minUnit} units at NPR ${openIssue.issuePrice}. Auto-apply queued.`,
        })

        enqueued++
      }
    }

    if (enqueued > 0) {
      console.log(`[pollOpenIPOs] [Y]  Enqueued ${enqueued} auto-apply job(s)`)
    } else {
      console.log('[pollOpenIPOs] [Y]  No new applications to enqueue')
    }
  } catch (err) {
    console.error('[pollOpenIPOs] [N] ', err instanceof Error ? err.message : err)
  }
}
