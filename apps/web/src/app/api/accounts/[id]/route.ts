import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipobaje/db'
import { requireSession } from '@/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await requireSession()
    const body = await req.json()
    const {
      isActive,
      bankId,
      bankName,
      accountNumber,
      accountBranchId,
      crnNumber,
      customerId,
    } = body as {
      isActive?: boolean
      bankId?: number | null
      bankName?: string | null
      accountNumber?: string | null
      accountBranchId?: number | null
      crnNumber?: string | null
      customerId?: number | null
    }

    const account = await prisma.meroShareAccount.findFirst({
      where: { id: params.id, userId },
    })

    if (!account) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (isActive !== undefined) data.isActive = isActive
    if (bankId !== undefined) data.bankId = bankId
    if (bankName !== undefined) data.bankName = bankName
    if (accountNumber !== undefined) data.accountNumber = accountNumber
    if (accountBranchId !== undefined) data.accountBranchId = accountBranchId
    if (crnNumber !== undefined) data.crnNumber = crnNumber
    if (customerId !== undefined) data.customerId = customerId

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No fields to update' },
        { status: 400 },
      )
    }

    const updated = await prisma.meroShareAccount.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        boid: true,
        dpName: true,
        fullName: true,
        bankId: true,
        bankName: true,
        accountNumber: true,
        accountBranchId: true,
        crnNumber: true,
        customerId: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: updated, error: null })
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await requireSession()

    const account = await prisma.meroShareAccount.findFirst({
      where: { id: params.id, userId },
    })

    if (!account) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    await prisma.meroShareAccount.delete({ where: { id: params.id } })

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
