'use client'

import { useParams } from 'next/navigation'
import { useIPOs } from '@/hooks/useIPOs'
import { StatusBadge, getStatusColor, getStatusLabel } from '@/components/common/StatusBadge'
import { ExternalLink } from 'lucide-react'
import { format, differenceInHours, differenceInDays } from 'date-fns'

export default function IPODetailPage() {
  const { id } = useParams<{ id: string }>()
  const { ipos, isLoading } = useIPOs()
  const ipo = ipos.find((i: Record<string, unknown>) => i.id === id)

  if (isLoading) return <div className="max-w-2xl"><div className="h-48 animate-pulse rounded-xl bg-[#0F0F0F]" /></div>
  if (!ipo) return <div className="flex flex-col items-center justify-center py-16"><p className="text-[13px] font-medium text-[#A0A0A0]">IPO not found</p></div>

  const closeDate = new Date(ipo.closeDate as string)
  const openDate = new Date(ipo.openDate as string)
  const now = new Date()
  const hoursUntilClose = differenceInHours(closeDate, now)
  const totalDays = differenceInDays(closeDate, openDate) || 1
  const daysElapsed = differenceInDays(now, openDate)
  const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#FAFAFA]">{ipo.companyName as string}</h2>
          <p className="text-[13px] text-[#A0A0A0]">{ipo.scrip as string}</p>
        </div>
        <StatusBadge color={getStatusColor(ipo.status as string)} label={getStatusLabel(ipo.status as string)} />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-5">
        <div className="flex items-center justify-between text-[11px] text-[#707070]">
          <span>Opened {format(openDate, 'MMM d')}</span>
          <span>Closes {format(closeDate, 'MMM d, yyyy')}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-white/[0.15]" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-center text-[12px] text-[#707070]">
          {hoursUntilClose < 0 ? 'Closed' : hoursUntilClose < 24 ? `${hoursUntilClose} hours remaining` : `${Math.round(hoursUntilClose / 24)} days remaining`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailItem label="Share Type" value={ipo.shareType as string} />
        <DetailItem label="Share Group" value={ipo.shareGroup as string} />
        <DetailItem label="Open Date" value={format(openDate, 'MMM d, yyyy')} />
        <DetailItem label="Close Date" value={format(closeDate, 'MMM d, yyyy')} />
        <DetailItem label="Issue Price" value={`NPR ${ipo.issuePrice}`} />
        <DetailItem label="Units" value={`${ipo.minUnit} – ${ipo.maxUnit}`} />
      </div>

      {ipo.prospectusUrl && (
        <a href={ipo.prospectusUrl as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-[#A0A0A0] transition-colors hover:text-[#E0E0E0]">
          <ExternalLink size={14} strokeWidth={1.5} /> View Prospectus
        </a>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-4">
      <p className="text-[11px] text-[#707070]">{label}</p>
      <p className="mt-0.5 text-[14px] font-medium text-[#FAFAFA]">{value}</p>
    </div>
  )
}
