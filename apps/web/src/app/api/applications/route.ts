import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession()

    const url = new URL(req.url)
    const statusFilter = url.searchParams.get('status') ?? undefined
    const page = parseInt(url.searchParams.get('page') ?? '0', 10)
    const size = Math.min(parseInt(url.searchParams.get('size') ?? '20', 10), 100)

    const where: Record<string, unknown> = {
      account: { userId },
    }

    if (statusFilter) {
      where.status = statusFilter
    }

    const [applications, totalCount] = await Promise.all([
      prisma.iPOApplication.findMany({
        where,
        include: {
          account: { select: { boid: true, dpName: true } },
          issue: { select: { scrip: true, companyName: true, issuePrice: true, minUnit: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: page * size,
        take: size,
      }),
      prisma.iPOApplication.count({ where }),
    ])

    return NextResponse.json({
      data: { applications, totalCount, page, size },
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
