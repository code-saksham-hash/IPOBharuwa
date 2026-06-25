'use client'

import { useIPOs } from '@/hooks/useIPOs'
import { StatusBadge, getStatusColor, getStatusLabel } from '@/components/common/StatusBadge'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { CandlestickChart } from 'lucide-react'
import { format, differenceInHours, isAfter, differenceInDays } from 'date-fns'
import Link from 'next/link'

const HEADERS = ['Scrip', 'Company', 'Type', 'Open', 'Close', 'Price', 'Units', 'Status']

export default function IPOPage() {
  const { ipos, isLoading } = useIPOs()

  return (
    <div>
      {isLoading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : ipos.length === 0 ? (
        <EmptyState icon={CandlestickChart} title="No IPO records" description="Open IPOs appear once the worker detects them" />
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
    </div>
  )
}
