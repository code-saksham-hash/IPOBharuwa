import { EmptyState } from '@/components/common/EmptyState'
import { Briefcase } from 'lucide-react'

export interface HoldingRow {
  companyShareId: number
  scrip: string
  companyName: string
  totalUnits: number
  previousClosingPrice: number
  valueAsOfClose: number
  totalValue: number
  accountBoid?: string
  accountDpName?: string
}

interface HoldingsTableProps {
  holdings: HoldingRow[]
  isLoading?: boolean
}

const TH = ({ children }: { children: string }) => (
  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#707070]">
    {children}
  </th>
)

export function HoldingsTable({ holdings, isLoading }: HoldingsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-[13px] font-medium text-[#FAFAFA]">Portfolio Holdings</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">{['#', 'Company / Scrip', 'Units', 'Prev. Close', 'Value at Close', 'Total Value'].map(h => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (holdings.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-[13px] font-medium text-[#FAFAFA]">Portfolio Holdings</h3>
        </div>
        <EmptyState icon={Briefcase} title="No holdings found" description="Your CDSC portfolio holdings will appear here" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <h3 className="text-[13px] font-medium text-[#FAFAFA]">Portfolio Holdings</h3>
        <span className="text-[11px] text-[#707070]">{holdings.length} holding{holdings.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">{['#', 'Company / Scrip', 'Units', 'Prev. Close', 'Value at Close', 'Total Value'].map(h => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={`${h.companyShareId}-${h.accountBoid ?? i}`} className="border-b border-white/5 transition-colors hover:bg-white/[0.02] last:border-b-0">
                <td className="px-4 py-3 text-[12px] text-[#606060]">{i + 1}</td>
                <td className="max-w-[200px] px-4 py-3">
                  <p className="truncate text-[13px] font-medium text-[#FAFAFA]" title={h.companyName}>{h.companyName}</p>
                  <p className="text-[11px] text-[#707070]">{h.scrip}</p>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#E0E0E0] tabular-nums">{h.totalUnits.toLocaleString()}</td>
                <td className="px-4 py-3 text-[13px] text-[#A0A0A0] tabular-nums">{h.previousClosingPrice > 0 ? `NPR ${h.previousClosingPrice.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-[13px] text-[#A0A0A0] tabular-nums">{h.valueAsOfClose > 0 ? `NPR ${h.valueAsOfClose.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-[13px] font-medium tabular-nums text-[#E0E0E0]">{h.totalValue > 0 ? `NPR ${h.totalValue.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
            <tr className="border-t border-white/5 bg-white/[0.02]">
              <td colSpan={3} className="px-4 py-3 text-[12px] font-medium text-[#A0A0A0]">Total</td>
              <td className="px-4 py-3 text-[12px] text-[#A0A0A0]">—</td>
              <td className="px-4 py-3 text-[12px] text-[#A0A0A0]">—</td>
              <td className="px-4 py-3 text-[13px] font-semibold tabular-nums text-[#FAFAFA]">NPR {holdings.reduce((sum, h) => sum + h.totalValue, 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
