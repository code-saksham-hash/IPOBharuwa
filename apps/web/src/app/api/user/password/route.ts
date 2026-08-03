import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireSession()
    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { data: null, error: 'Current and new password are required' },
        { status: 400 },
      )
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { data: null, error: 'New password must be at least 6 characters' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.hashedPassword)
    if (!valid) {
      return NextResponse.json({ data: null, error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { hashedPassword } })

    return NextResponse.json({ data: { updated: true }, error: null })
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
