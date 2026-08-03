import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// Requires re-entering the password as confirmation before a destructive,
// irreversible delete. Cascades through MeroShareAccount -> IPOApplication
// and Notification per the schema's onDelete: Cascade relations.
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireSession()
    const { password } = (await req.json()) as { password?: string }

    if (!password) {
      return NextResponse.json(
        { data: null, error: 'Password is required to confirm deletion' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, user.hashedPassword)
    if (!valid) {
      return NextResponse.json({ data: null, error: 'Incorrect password' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: userId } })

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
