import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'
import { getAutoApplyQueue } from '@/lib/queue'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await requireSession()

    const ipo = await prisma.iPOIssue.findUnique({
      where: { id: params.id },
    })

    if (!ipo) {
      return NextResponse.json({ data: null, error: 'IPO not found' }, { status: 404 })
    }

    if (ipo.status !== 'OPEN') {
      return NextResponse.json({ data: null, error: 'IPO is not open for applications' }, { status: 400 })
    }

    const accounts = await prisma.meroShareAccount.findMany({
      where: { userId, isActive: true },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ data: null, error: 'No active MeroShare accounts found' }, { status: 400 })
    }

    const results: Array<{ accountId: string; applicationId: string; created: boolean }> = []

    for (const account of accounts) {
      // Check if already applied
      const existing = await prisma.iPOApplication.findUnique({
        where: {
          accountId_issueId: {
            accountId: account.id,
            issueId: ipo.id,
          },
        },
      })

      if (existing) {
        results.push({ accountId: account.id, applicationId: existing.id, created: false })
        continue
      }

      // Create pending application
      const application = await prisma.iPOApplication.create({
        data: {
          accountId: account.id,
          issueId: ipo.id,
          appliedKitta: ipo.minUnit,
          status: 'PENDING',
        },
      })

      // Enqueue auto-apply job
      try {
        await getAutoApplyQueue().add('auto-apply', {
          applicationId: application.id,
          accountId: account.id,
          issueId: ipo.id,
        })
      } catch (queueErr) {
        console.error('[apply] Failed to enqueue job:', queueErr)
      }

      results.push({ accountId: account.id, applicationId: application.id, created: true })
    }

    const created = results.filter((r) => r.created).length
    const skipped = results.filter((r) => !r.created).length

    return NextResponse.json({
      data: { results, created, skipped },
      error: null,
    })
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
