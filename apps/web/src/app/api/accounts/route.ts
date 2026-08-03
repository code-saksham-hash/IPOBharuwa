import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'
import { encrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const { userId } = await requireSession()

    const accounts = await prisma.meroShareAccount.findMany({
      where: { userId },
      select: {
        id: true,
        boid: true,
        username: true,
        dpId: true,
        dpName: true,
        fullName: true,
        bankId: true,
        bankName: true,
        accountNumber: true,
        accountBranchId: true,
        crnNumber: true,
        isActive: true,
        lastLoginAt: true,
        lastAppliedAt: true,
        createdAt: true,
        encryptedTransactionPin: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const withPinFlag = accounts.map(({ encryptedTransactionPin, ...rest }) => ({
      ...rest,
      hasTransactionPin: encryptedTransactionPin !== null,
    }))

    return NextResponse.json({ data: withPinFlag, error: null })
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession()
    const body = await req.json()

    const {
      username, dpId, dpName, password, transactionPin,
      boid: bodyBoid, fullName, clientCode, email, contact, address,
      bankId, bankName, accountNumber, accountBranchId, crnNumber, customerId,
    } = body as {
      username: string
      dpId: number
      dpName: string
      password: string
      transactionPin?: string
      boid?: string
      fullName?: string | null
      clientCode?: string | null
      email?: string | null
      contact?: string | null
      address?: string | null
      bankId?: number | null
      bankName?: string | null
      accountNumber?: string | null
      accountBranchId?: number | null
      crnNumber?: string | null
      customerId?: number | null
    }

    const { password: _redacted, ...bodyForLog } = body as Record<string, unknown>
    console.log('[accounts] === RAW REQUEST BODY (password redacted) ===')
    console.log('[accounts] Full body:', JSON.stringify(bodyForLog, null, 2))
    console.log('[accounts] Top-level keys:', Object.keys(bodyForLog))
    console.log('[accounts] bankId:', bankId, '| bankName:', bankName)
    console.log('[accounts] accountNumber:', accountNumber, '| accountBranchId:', accountBranchId)
    console.log('[accounts] crnNumber:', crnNumber, '| customerId:', customerId)

    if (!username || !dpId || !dpName || !password) {
      return NextResponse.json(
        { data: null, error: 'Missing required fields: username, dpId, dpName, password' },
        { status: 400 },
      )
    }

    if (!transactionPin || !/^\d{4}$/.test(transactionPin)) {
      return NextResponse.json(
        { data: null, error: 'Transaction PIN is required and must be 4 digits — without it, auto-apply cannot submit applications' },
        { status: 400 },
      )
    }

    const boid = bodyBoid || username
    console.log(`[accounts] Saving — BOID: ${boid.slice(-6)}, name: ${fullName ?? 'N/A'}, bank: ${bankName ?? 'N/A'}`)

    const existing = await prisma.meroShareAccount.findUnique({
      where: { userId_boid: { userId, boid } },
    })
    if (existing) {
      return NextResponse.json(
        { data: null, error: `An account with BOID ${boid.slice(-6)} already exists` },
        { status: 409 },
      )
    }

    const encrypted = encrypt(password)
    const encryptedPin = encrypt(transactionPin)

    const account = await prisma.meroShareAccount.create({
      data: {
        userId,
        boid,
        username: username ?? null,
        dpId,
        dpName,
        fullName: fullName ?? null,
        encryptedPassword: encrypted.cipher,
        encryptionIv: encrypted.iv,
        encryptionTag: encrypted.tag,
        encryptedTransactionPin: encryptedPin.cipher,
        transactionPinIv: encryptedPin.iv,
        transactionPinTag: encryptedPin.tag,
        bankId: bankId ?? null,
        bankName: bankName ?? null,
        accountNumber: accountNumber ?? null,
        accountBranchId: accountBranchId ?? null,
        crnNumber: crnNumber ?? null,
        customerId: customerId ?? null,
      },
      select: {
        id: true,
        boid: true,
        username: true,
        dpId: true,
        dpName: true,
        fullName: true,
        bankName: true,
        accountNumber: true,
        accountBranchId: true,
        crnNumber: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: account, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[accounts] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
