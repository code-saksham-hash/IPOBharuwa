import { NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'

export async function GET() {
  try {
    const { userId } = await requireSession()

    const allotted = await prisma.iPOApplication.findMany({
      where: {
        account: { userId },
        status: 'ALLOTTED',
      },
      include: {
        account: { select: { boid: true, dpName: true } },
        issue: { select: { scrip: true, companyName: true, issuePrice: true } },
      },
      orderBy: { resultCheckedAt: 'desc' },
    })

    const summary = {
      totalAllotted: allotted.length,
      totalUnits: allotted.reduce((sum, a) => sum + (a.allottedKitta ?? 0), 0),
      items: allotted,
    }

    return NextResponse.json({ data: summary, error: null })
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
