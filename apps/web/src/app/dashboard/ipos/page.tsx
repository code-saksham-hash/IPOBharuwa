'use client'

import { useState } from 'react'
import { useIPOs } from '@/hooks/useIPOs'
import { useDetectedIssues } from '@/hooks/useDetectedIssues'
import { StatusBadge, getStatusColor, getStatusLabel } from '@/components/common/StatusBadge'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { AddIPOModal, type IPOPrefill } from '@/components/ipos/AddIPOModal'
import { CandlestickChart, Plus, Sparkles, X as XIcon } from 'lucide-react'
import { format, differenceInHours, isAfter, differenceInDays } from 'date-fns'
import Link from 'next/link'

const HEADERS = ['Scrip', 'Company', 'Type', 'Open', 'Close', 'Price', 'Units', 'Status']

export default function IPOPage() {
  const { ipos, isLoading, mutate } = useIPOs()
  const { detected, mutate: mutateDetected } = useDetectedIssues()
  const [showAddModal, setShowAddModal] = useState(false)
  const [prefill, setPrefill] = useState<IPOPrefill | null>(null)

  const openBlank = () => { setPrefill(null); setShowAddModal(true) }
  const openForDetected = (d: Record<string, unknown>) => {
    setPrefill({
      detectedIssueId: d.id as string,
      companyName: d.companyName as string,
      shareTypeRaw: (d.shareTypeRaw as string | null) ?? null,
      openDate: d.openDate as string,
      closeDate: d.closeDate as string,
      estimatedPrice: d.estimatedPrice ? Number(d.estimatedPrice) : null,
    })
    setShowAddModal(true)
  }

  const handleDismiss = async (id: string) => {
    await fetch(`/api/ipos/detected/${id}`, { method: 'DELETE' })
    mutateDetected()
  }

  return (
    <div>
      {detected.length > 0 && (
        <div className="mb-4 space-y-2">
          {detected.map((d: Record<string, unknown>) => (
            <div key={d.id as string} className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3">
              <div className="flex items-start gap-2.5">
                <Sparkles size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-[13px] font-medium text-[#FAFAFA]">{d.companyName as string}</p>
                  <p className="text-[11px] text-[#A0A0A0]">
                    Detected on CDSC's public list — open {format(new Date(d.openDate as string), 'MMM d')}
                    {' '}–{' '}{format(new Date(d.closeDate as string), 'MMM d, yyyy')}. Needs share ID + min/max unit to enable auto-apply.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => openForDetected(d)}
                  className="rounded-lg border border-white/10 bg-[#0F0F0F] px-3 py-1.5 text-[12px] font-medium text-[#FAFAFA] transition-colors hover:bg-white/[0.06]"
                >
                  Complete Details
                </button>
                <button
                  onClick={() => handleDismiss(d.id as string)}
                  className="rounded-lg p-1.5 text-[#707070] transition-colors hover:text-white"
                  title="Dismiss"
                >
                  <XIcon size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={openBlank}
          className="inline-flex items-center gap-1.5 rounded border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-2 text-[13px] text-white transition-colors hover:border-[#333333]"
        >
          <Plus size={15} strokeWidth={1.5} />
          Add IPO
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : ipos.length === 0 ? (
        <EmptyState
          icon={CandlestickChart}
          title="No IPO records"
          description="CDSC blocks automated discovery, so add issues manually as they're announced"
          action={{ label: 'Add IPO', onClick: openBlank }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {HEADERS.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#707070]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipos.map((ipo: Record<string, unknown>) => {
                  const closeDate = new Date(ipo.closeDate as string)
                  const openDate = new Date(ipo.openDate as string)
                  const now = new Date()
                  const hoursUntilClose = differenceInHours(closeDate, now)
                  const isClosingSoon = hoursUntilClose < 24 && hoursUntilClose > 0
                  const isClosed = isAfter(now, closeDate)
                  const totalDays = differenceInDays(closeDate, openDate) || 1
                  const daysElapsed = differenceInDays(now, openDate)
                  const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))

                  let status: string
                  if (isClosed) status = 'CLOSED'
                  else if (isClosingSoon) status = 'CLOSING_SOON'
                  else status = (ipo.status as string)

                  return (
                    <tr key={ipo.companyShareId as number} className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/ipos/${ipo.id}`} className="text-[13px] font-medium text-[#FAFAFA] hover:underline">{ipo.scrip as string}</Link>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#FAFAFA]">{ipo.companyName as string}</td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">{ipo.shareType as string}</td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">{format(openDate, 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-[#A0A0A0]">{format(closeDate, 'MMM d, yyyy')}</span>
                        <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-white/[0.15]" style={{ width: `${progressPct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">NPR {ipo.issuePrice as number}</td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">{ipo.minUnit as number}–{ipo.maxUnit as number}</td>
                      <td className="px-4 py-3"><StatusBadge color={getStatusColor(status)} label={getStatusLabel(status)} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddIPOModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={() => { mutate(); mutateDetected() }}
        prefill={prefill}
      />
    </div>
  )
}
