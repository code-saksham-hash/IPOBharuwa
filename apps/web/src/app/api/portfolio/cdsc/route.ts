import { NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'

export async function GET() {
  try {
    const { userId } = await requireSession()

    const [applications, allottedApps, accounts] = await Promise.all([
      prisma.iPOApplication.findMany({
        where: { account: { userId } },
        include: {
          account: { select: { boid: true, dpName: true } },
          issue: { select: { scrip: true, companyName: true, issuePrice: true, shareType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.iPOApplication.findMany({
        where: { account: { userId }, status: 'ALLOTTED' },
        include: {
          account: { select: { boid: true, dpName: true } },
          issue: { select: { scrip: true, companyName: true, issuePrice: true } },
        },
        orderBy: { resultCheckedAt: 'desc' },
      }),
      prisma.meroShareAccount.findMany({
        where: { userId, isActive: true },
        select: { id: true, boid: true, dpName: true },
      }),
    ])

    const holdings = allottedApps.map((app) => ({
      companyShareId: 0,
      scrip: app.issue.scrip,
      companyName: app.issue.companyName,
      totalUnits: app.allottedKitta ?? app.appliedKitta,
      previousClosingPrice: Number(app.issue.issuePrice) || 0,
      valueAsOfClose: (app.allottedKitta ?? app.appliedKitta) * Number(app.issue.issuePrice || 0),
      totalValue: (app.allottedKitta ?? app.appliedKitta) * Number(app.issue.issuePrice || 0),
      accountBoid: app.account.boid,
      accountDpName: app.account.dpName,
    }))

    const allotments = applications.map((app) => ({
      companyShareId: 0,
      scrip: app.issue.scrip,
      companyName: app.issue.companyName,
      appliedDate: app.appliedAt?.toISOString() ?? app.createdAt.toISOString(),
      appliedKitta: app.appliedKitta,
      allottedKitta: app.allottedKitta ?? 0,
      statusName: app.status,
      accountBoid: app.account.boid,
      accountDpName: app.account.dpName,
    }))

    const hasAccounts = accounts.length > 0

    return NextResponse.json({
      data: {
        holdings,
        allotments,
        errors: [] as Array<{ boid: string; dpName: string; category: string; message: string }>,
        accountsFound: hasAccounts,
        accountCount: accounts.length,
        successCount: accounts.length,
        source: 'database',
      },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[portfolio] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
