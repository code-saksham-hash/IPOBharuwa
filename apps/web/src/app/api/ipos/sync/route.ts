import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'
import { decrypt } from '@/lib/crypto'
import { ensurePendingApplication } from '@/lib/ipoSync'
import { MeroShareClient } from '@ipobaje/meroshare-client'

// Logs into CDSC for one account and pulls current issues + pending applications
// immediately, instead of waiting for the worker's next 4-hour poll. Called right
// after an account is added so the dashboard isn't empty until the next cron tick.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession()
    const { accountId } = (await req.json()) as { accountId?: string }

    if (!accountId) {
      return NextResponse.json(
        { data: null, error: 'Missing required field: accountId' },
        { status: 400 },
      )
    }

    const account = await prisma.meroShareAccount.findFirst({
      where: { id: accountId, userId },
    })
    if (!account) {
      return NextResponse.json({ data: null, error: 'Account not found' }, { status: 404 })
    }

    const password = decrypt({
      cipher: account.encryptedPassword,
      iv: account.encryptionIv,
      tag: account.encryptionTag,
    })

    const client = new MeroShareClient()
    await client.login(account.dpId, account.username || account.boid, password)
    const issues = await client.getCurrentIssues()

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

    const openIssues = await prisma.iPOIssue.findMany({ where: { status: 'OPEN' } })

    let enqueued = 0
    for (const openIssue of openIssues) {
      const created = await ensurePendingApplication({ id: account.id, userId }, openIssue)
      if (created) enqueued++
    }

    return NextResponse.json({
      data: { syncedIssues: issues.length, enqueuedApplications: enqueued },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[ipos/sync] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
