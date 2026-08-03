'use client'

import { useState } from 'react'
import { useApplicationsCDSC } from '@/hooks/useApplicationsCDSC'
import { useAccounts } from '@/hooks/useAccounts'
import { AllotmentTable } from '@/components/applications/AllotmentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { FileText } from 'lucide-react'

type Filter = 'All' | 'Applied' | 'Allotted' | 'Failed'

function mapStatus(statusName: string): Filter {
  const lower = statusName.toLowerCase().trim()
  if (lower === 'alloted' || lower === 'allotted') return 'Allotted'
  if (lower === 'not alloted' || lower === 'not allotted' || lower === 'not_allotted') return 'Failed'
  if (lower === 'rejected' || lower === 'failed') return 'Failed'
  return 'Applied'
}

const FILTERS: Filter[] = ['All', 'Applied', 'Allotted', 'Failed']

export default function HistoryPage() {
  const { applications, isLoading, errors } = useApplicationsCDSC()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const [filter, setFilter] = useState<Filter>('All')

  const hasAccounts = accounts.length > 0

  if (!accountsLoading && !hasAccounts) {
    return (
      <EmptyState
        icon={FileText}
        title="No accounts linked"
        description="Link a MeroShare account to see your application history"
      />
    )
  }

  const filtered =
    filter === 'All' ? applications : applications.filter((a) => mapStatus(a.statusName) === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-1 text-[12px] transition-colors ${
              filter === f
                ? 'border-[#333333] bg-white/[0.08] text-white'
                : 'border-[#1A1A1A] bg-[#0D0D0D] text-[#666666] hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded border border-[#1A1A1A] bg-[#0D0D0D] p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-[12px] text-[#666666]">
              {err.dpName}: {err.message}
            </p>
          ))}
        </div>
      )}

      <AllotmentTable allotments={filtered} isLoading={isLoading} />
    </div>
  )
}
