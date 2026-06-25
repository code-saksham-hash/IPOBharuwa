'use client'

import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useAccounts } from '@/hooks/useAccounts'
import { HoldingsTable } from '@/components/portfolio/HoldingsTable'
import { AllotmentTable } from '@/components/portfolio/AllotmentTable'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { AddAccountModal } from '@/components/accounts/AddAccountModal'
import { AlertTriangle, Briefcase, RefreshCw } from 'lucide-react'

export default function PortfolioPage() {
  const { data, isLoading, isValidating, mutate } = usePortfolio()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const [showAddModal, setShowAddModal] = useState(false)

  const hasAccounts = accounts.length > 0

  if (!accountsLoading && !hasAccounts) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Briefcase}
          title="No accounts linked"
          description="Link a MeroShare account to see your live portfolio"
          action={{ label: 'Add Account', onClick: () => setShowAddModal(true) }}
        />
        <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdded={mutate} />
      </div>
    )
  }

  if (isLoading || accountsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-medium text-[#FAFAFA]">Portfolio</h3>
            <p className="text-[12px] text-[#707070]">Live data from CDSC</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <HoldingsTable holdings={[]} isLoading />
        <AllotmentTable allotments={[]} isLoading />
      </div>
    )
  }

  const holdings = data?.holdings ?? []
  const allotments = data?.allotments ?? []
  const errors = data?.errors ?? []

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)
  const totalUnits = holdings.reduce((sum, h) => sum + h.totalUnits, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-[#FAFAFA]">Portfolio</h3>
          <p className="text-[12px] text-[#707070]">
            Data from worker pipeline (DB){' — '}
            <span className="text-[11px] text-amber-400/80">
              CDSC endpoints returning 500 — live fetch unavailable
            </span>
            {isValidating && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#606060]">
                <RefreshCw size={10} className="animate-spin" />
                refreshing...
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0F0F0F] px-3 py-1.5 text-[12px] text-[#A0A0A0] transition-colors hover:border-white/[0.15] hover:text-[#E0E0E0] disabled:opacity-40"
        >
          <RefreshCw size={13} strokeWidth={1.5} className={isValidating ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error banners */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((err, i) => (
            <div key={`${err.boid}-${i}`} className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-[#0F0F0F] px-4 py-3">
              <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="text-[12px] font-medium text-[#A0A0A0]">{err.dpName} — {err.category.replace(/_/g, ' ')}</p>
                <p className="text-[11px] text-[#707070]">{err.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value={totalPortfolioValue > 0 ? `NPR ${totalPortfolioValue.toLocaleString()}` : '—'}
        />
        <StatCard label="Companies" value={holdings.length} subtitle={holdings.length > 0 ? 'unique holdings' : 'no holdings yet'} />
        <StatCard label="Total Units" value={totalUnits > 0 ? totalUnits.toLocaleString() : '—'} />
        <StatCard label="Records" value={allotments.length} subtitle="application history" />
      </div>

      <HoldingsTable holdings={holdings} />
      <AllotmentTable allotments={allotments} />

      <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdded={mutate} />
    </div>
  )
}
