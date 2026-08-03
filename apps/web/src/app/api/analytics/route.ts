import { NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'

export async function GET() {
  try {
    const { userId } = await requireSession()

    const applications = await prisma.iPOApplication.findMany({
      where: {
        account: { userId },
      },
      select: {
        status: true,
        createdAt: true,
      },
    })

    // Aggregate by month
    const monthlyMap = new Map<string, { applications: number; allotments: number }>()

    let totalApplied = 0
    let totalAllotted = 0
    let totalPending = 0
    let totalFailed = 0

    for (const app of applications) {
      const month = app.createdAt.toISOString().slice(0, 7) // YYYY-MM

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { applications: 0, allotments: 0 })
      }
      const entry = monthlyMap.get(month)!

      entry.applications++
      totalApplied++

      if (app.status === 'ALLOTTED') {
        entry.allotments++
        totalAllotted++
      } else if (app.status === 'PENDING' || app.status === 'APPLYING' || app.status === 'APPLIED') {
        totalPending++
      } else if (app.status === 'NOT_ALLOTTED' || app.status === 'FAILED') {
        totalFailed++
      }
    }

    // Sort months chronologically
    const sorted = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    const completed = totalAllotted + totalFailed
    const successRate = completed > 0 ? Math.round((totalAllotted / completed) * 100) : 0

    return NextResponse.json({
      data: {
        monthlyData: sorted,
        totals: {
          totalApplied,
          totalAllotted,
          totalPending,
          totalFailed,
          successRate,
        },
      },
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
