import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'
import { ensurePendingApplication } from '@/lib/ipoSync'

export async function GET() {
  try {
    await requireSession()

    const ipos = await prisma.iPOIssue.findMany({
      orderBy: { openDate: 'desc' },
    })

    return NextResponse.json({ data: ipos, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

// Manual entry point for new issues — CDSC's WAF blocks automated discovery
// of the "currently open" listing, so this lets a user seed an issue by hand
// (e.g. after seeing it announced on MeroShare). Everything downstream —
// auto-apply, notifications, result-checking — still runs fully automatically
// once the issue exists here.
export async function POST(req: NextRequest) {
  try {
    await requireSession()
    const body = (await req.json()) as {
      companyShareId: number
      scrip: string
      companyName: string
      shareType: string
      shareGroup: string
      openDate: string
      closeDate: string
      issuePrice: number
      minUnit: number
      maxUnit: number
    }

    const {
      companyShareId, scrip, companyName, shareType, shareGroup,
      openDate, closeDate, issuePrice, minUnit, maxUnit,
    } = body

    if (
      !companyShareId || !scrip || !companyName || !shareType || !shareGroup ||
      !openDate || !closeDate || issuePrice == null || !minUnit || !maxUnit
    ) {
      return NextResponse.json(
        { data: null, error: 'Missing required IPO fields' },
        { status: 400 },
      )
    }

    const issue = await prisma.iPOIssue.upsert({
      where: { companyShareId },
      create: {
        companyShareId,
        scrip,
        companyName,
        shareType,
        shareGroup,
        status: 'OPEN',
        openDate: new Date(openDate),
        closeDate: new Date(closeDate),
        issuePrice,
        minUnit,
        maxUnit,
      },
      update: {
        status: 'OPEN',
        closeDate: new Date(closeDate),
        issuePrice,
        minUnit,
        maxUnit,
      },
    })

    const activeAccounts = await prisma.meroShareAccount.findMany({
      where: { isActive: true },
    })

    let enqueued = 0
    for (const account of activeAccounts) {
      const created = await ensurePendingApplication(
        { id: account.id, userId: account.userId },
        issue,
      )
      if (created) enqueued++
    }

    return NextResponse.json({ data: { issue, enqueuedApplications: enqueued }, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[ipos] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
