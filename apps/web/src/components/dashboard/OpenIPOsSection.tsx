'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { IPOIssue } from '@ipopilot/meroshare-client'
import { EmptyState } from '@/components/common/EmptyState'
import { Calendar } from 'lucide-react'

interface OpenIPOsSectionProps {
  ipos: IPOIssue[]
  isLoading: boolean
}

function getCountdown(closeDate: string): string {
  const now = new Date()
  const close = new Date(closeDate)
  const diffMs = close.getTime() - now.getTime()

  if (diffMs <= 0) return 'Closed'

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

export function OpenIPOsSection({ ipos, isLoading }: OpenIPOsSectionProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleApply = async (ipoId: string) => {
    setApplyingId(ipoId)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[ipoId]
      return next
    })

    try {
      const res = await fetch(`/api/ipos/${ipoId}/apply`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok || json.error) {
        setErrors((prev) => ({ ...prev, [ipoId]: json.error ?? 'Failed' }))
        return
      }

      setAppliedIds((prev) => new Set(prev).add(ipoId))
    } catch {
      setErrors((prev) => ({ ...prev, [ipoId]: 'Network error' }))
    } finally {
      setApplyingId(null)
    }
  }

  const openIpos = ipos.filter((ipo) => {
    const status = (ipo as unknown as { status?: string }).status ?? ipo.statusName
    return status === 'OPEN'
  })

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-white/[0.04]" />
          ))}
        </div>
      </div>
    )
  }

  if (openIpos.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No IPOs open"
        description="No IPO issues are currently accepting applications."
      />
    )
  }

  return (
    <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D]">
      <div className="border-b border-[#1A1A1A] px-5 py-3">
        <h3 className="text-[13px] font-medium text-white">
          Open Right Now{' '}
          <span className="text-[#666666]">({openIpos.length})</span>
        </h3>
      </div>
      <div className="divide-y divide-[#1A1A1A]">
        {openIpos.map((ipo) => {
          const ipoId = (ipo as unknown as { id: string }).id ?? String(ipo.companyShareId)
          const isApplying = applyingId === ipoId
          const isApplied = appliedIds.has(ipoId)
          const error = errors[ipoId]

          return (
            <div key={ipo.companyShareId} className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/ipos/${ipoId}`}
                  className="text-[13px] font-medium text-white hover:text-[#CCCCCC]"
                >
                  {ipo.companyName}
                </Link>
                <div className="mt-0.5 flex items-center gap-3 text-[12px] text-[#666666]">
                  <span>{ipo.scrip}</span>
                  <span className="text-[#444444]">•</span>
                  <span>{ipo.shareTypeName}</span>
                  <span className="text-[#444444]">•</span>
                  <span>
                    Min {ipo.minUnit} unit{ipo.minUnit !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[#444444]">•</span>
                  <span>NPR {ipo.issuePrice}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-[#666666]">
                  {getCountdown(ipo.closeDate)}
                </span>
                {isApplied ? (
                  <span className="text-[12px] text-[#444444]">Queued</span>
                ) : (
                  <button
                    onClick={() => handleApply(ipoId)}
                    disabled={isApplying}
                    className="rounded border border-[#1A1A1A] bg-[#0D0D0D] px-3 py-1.5 text-[12px] text-white transition-colors hover:border-[#333333] disabled:opacity-50"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                )}
                {error && (
                  <span className="text-[11px] text-[#444444]">{error}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
