import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'

// Dismisses a detected draft, or cleans one up after its details were completed
// and promoted into a real IPOIssue via POST /api/ipos.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession()

    const existing = await prisma.detectedIssue.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    await prisma.detectedIssue.delete({ where: { id: params.id } })

    return NextResponse.json({ data: { deleted: true }, error: null })
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
