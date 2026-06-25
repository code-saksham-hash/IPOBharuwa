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
    const account = await prisma.meroShareAccount.findFirst({
      where: { isActive: true },
    })

    if (!account) {
      console.log('[pollOpenIPOs] [warn]  No active accounts — skipping')
      return
    }

    const password = decrypt({
      cipher: account.encryptedPassword,
      iv: account.encryptionIv,
      tag: account.encryptionTag,
    })

    const client = new MeroShareClient()
    await client.login(account.dpId, account.boid, password)
    console.log(`[pollOpenIPOs] [Y]  Authenticated with account ${account.boid.slice(-6)}`)

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
