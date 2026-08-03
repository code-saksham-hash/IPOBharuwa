import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession()

    const ipo = await prisma.iPOIssue.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          include: { account: { select: { boid: true, dpName: true } } },
        },
      },
    })

    if (!ipo) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data: ipo, error: null })
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
