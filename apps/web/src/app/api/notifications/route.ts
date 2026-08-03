import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession()

    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data: notifications, error: null })
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

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireSession()
    const body = await req.json().catch(() => ({}))
    const { ids } = (body as { ids?: string[] }) ?? {}

    const where: Record<string, unknown> = { userId }
    if (ids && ids.length > 0) {
      where.id = { in: ids }
      const belonging = await prisma.notification.findMany({
        where: { id: { in: ids }, userId },
        select: { id: true },
      })
      const belongingIds = new Set(belonging.map((n) => n.id))
      const validIds = ids.filter((id) => belongingIds.has(id))
      if (validIds.length === 0) {
        return NextResponse.json({ data: null, error: 'No valid notifications found' }, { status: 404 })
      }
      where.id = { in: validIds }
    }

    await prisma.notification.updateMany({
      where: where as never,
      data: { isRead: true },
    })

    return NextResponse.json({ data: { marked: true }, error: null })
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
