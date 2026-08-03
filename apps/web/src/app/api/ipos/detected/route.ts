import { NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'

export async function GET() {
  try {
    await requireSession()

    const detected = await prisma.detectedIssue.findMany({
      orderBy: { detectedAt: 'desc' },
    })

    return NextResponse.json({ data: detected, error: null })
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
