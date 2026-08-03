import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { FileCheck } from 'lucide-react'
import { format } from 'date-fns'

export interface AllotmentRow {
  companyShareId: number
  scrip: string
  companyName: string
  appliedDate: string | null
  appliedKitta: number
  allottedKitta: number
  statusName: string
  accountBoid?: string
  accountDpName?: string
}

interface AllotmentTableProps {
  allotments: AllotmentRow[]
  isLoading?: boolean
}

function mapStatus(statusName: string): { color: 'green' | 'red' | 'blue' | 'gray'; label: string } {
  const lower = statusName.toLowerCase().trim()
  if (lower === 'alloted' || lower === 'allotted') return { color: 'green', label: 'Allotted' }
  if (lower === 'not alloted' || lower === 'not allotted' || lower === 'not_allotted') return { color: 'red', label: 'Not Allotted' }
  if (lower === 'pending') return { color: 'gray', label: 'Pending' }
  if (lower === 'applied' || lower === 'submitted') return { color: 'blue', label: 'Applied' }
  if (lower === 'rejected' || lower === 'failed') return { color: 'red', label: 'Failed' }
  return { color: 'gray', label: statusName || 'Unknown' }
}

const TH = ({ children }: { children: string }) => (
  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#707070]">{children}</th>
)

export function AllotmentTable({ allotments, isLoading }: AllotmentTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-[13px] font-medium text-[#FAFAFA]">Application History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">{['#', 'Company / Scrip', 'Applied Date', 'Applied Units', 'Status', 'Allotted Units'].map(h => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-white/5 last:border-b-0">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-white/[0.04]" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (allotments.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-[13px] font-medium text-[#FAFAFA]">Application History</h3>
        </div>
        <EmptyState icon={FileCheck} title="No application history" description="IPO applications will appear here once submitted via MeroShare" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <h3 className="text-[13px] font-medium text-[#FAFAFA]">Application History</h3>
        <span className="text-[11px] text-[#707070]">{allotments.length} record{allotments.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">{['#', 'Company / Scrip', 'Applied Date', 'Applied Units', 'Status', 'Allotted Units'].map(h => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {allotments.map((a, i) => {
              const status = mapStatus(a.statusName)
              return (
                <tr key={`${a.companyShareId}-${a.accountBoid ?? i}`} className="border-b border-white/5 transition-colors hover:bg-white/[0.02] last:border-b-0">
                  <td className="px-4 py-3 text-[12px] text-[#606060]">{i + 1}</td>
                  <td className="max-w-[180px] px-4 py-3">
                    <p className="truncate text-[13px] font-medium text-[#FAFAFA]" title={a.companyName}>{a.companyName || '—'}</p>
                    <p className="text-[11px] text-[#707070]">{a.scrip || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#A0A0A0]">{a.appliedDate ? format(new Date(a.appliedDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-[13px] text-[#E0E0E0] tabular-nums">{a.appliedKitta > 0 ? a.appliedKitta.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge color={status.color} label={status.label} /></td>
                  <td className="px-4 py-3 text-[13px] tabular-nums">{a.allottedKitta > 0 ? <span className="font-medium text-[#E0E0E0]">{a.allottedKitta.toLocaleString()}</span> : <span className="text-[#606060]">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
