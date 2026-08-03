import { NextResponse } from 'next/server'
import { prisma } from '@ipopilot/db'
import { requireSession } from '@/lib/session'
import {
  loginToCDSC,
  fetchAllApplications,
  type CDSCCredentials,
  type CDSCAccountError,
} from '@/lib/fetchCDSC'
import type { AllotmentRow } from '@/components/applications/AllotmentTable'

export async function GET() {
  try {
    const { userId } = await requireSession()

    // 1. Get all active accounts for the user (including encrypted credentials)
    const accounts = await prisma.meroShareAccount.findMany({
      where: { userId, isActive: true },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        data: { applications: [], errors: [], accountCount: 0, successCount: 0 },
        error: null,
      })
    }

    // 2. Fetch for each account in parallel — one failing doesn't block others
    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        const credentials: CDSCCredentials = {
          dpId: account.dpId,
          boid: account.boid,
          username: account.username,
          encryptedPassword: account.encryptedPassword,
          encryptionIv: account.encryptionIv,
          encryptionTag: account.encryptionTag,
        }

        const session = await loginToCDSC(credentials)
        const { records, errors: fetchErrors } = await fetchAllApplications(session)

        // Map CDSC records to AllotmentRow, tagging with account identifiers
        const allotments: AllotmentRow[] = records.map((r) => ({
          companyShareId: (r.companyShareId as number) ?? 0,
          scrip: (r.scrip as string) ?? '—',
          companyName: (r.companyName as string) ?? 'Unknown',
          appliedDate: (r.appliedDate as string) ?? null,
          appliedKitta: (r.appliedKitta as number) ?? 0,
          allottedKitta: (r.allottedKitta as number) ?? 0,
          statusName: (r.statusName as string) ?? 'Unknown',
          accountBoid: account.boid,
          accountDpName: account.dpName,
        }))

        return {
          boid: account.boid,
          dpName: account.dpName,
          allotments,
          errors: fetchErrors,
        }
      }),
    )

    // 3. Aggregate results
    const applications: AllotmentRow[] = []
    const errors: CDSCAccountError[] = []
    let successCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const val = result.value
        applications.push(...val.allotments)
        if (val.errors.length > 0) {
          errors.push({
            boid: val.boid,
            dpName: val.dpName,
            category: categorizeError(val.errors[0]!),
            message: val.errors.join('; '),
          })
        }
        successCount++
      } else {
        // Full account failure — login or all fetches threw
        const message =
          result.reason instanceof Error ? result.reason.message : String(result.reason)
        errors.push({
          boid: 'unknown',
          dpName: 'Unknown',
          category: categorizeError(message),
          message,
        })
      }
    }

    // 4. Deduplicate across accounts by companyShareId (first occurrence wins)
    const seen = new Set<number>()
    const deduplicated = applications.filter((app) => {
      if (seen.has(app.companyShareId)) return false
      seen.add(app.companyShareId)
      return true
    })

    return NextResponse.json({
      data: {
        applications: deduplicated,
        errors,
        accountCount: accounts.length,
        successCount,
      },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[applications/cdsc] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

function categorizeError(message: string): CDSCAccountError['category'] {
  const lower = message.toLowerCase()
  if (lower.includes('decrypt') || lower.includes('invalid credential') || lower.includes('password')) {
    return 'CREDENTIAL_ERROR'
  }
  if (lower.includes('blocked') || lower.includes('403') || lower.includes('429') || lower.includes('waf')) {
    return 'WAF_ERROR'
  }
  if (lower.includes('timeout') || lower.includes('network') || lower.includes('unreachable')) {
    return 'NETWORK_ERROR'
  }
  return 'UNEXPECTED_ERROR'
}
