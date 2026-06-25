'use client'

import { useState } from 'react'
import { useApplications } from '@/hooks/useApplications'
import { StatusBadge, getStatusColor, getStatusLabel } from '@/components/common/StatusBadge'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { FileCheck, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Allotted', value: 'ALLOTTED' },
  { label: 'Failed', value: 'FAILED' },
]

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { applications, isLoading } = useApplications(statusFilter ? { status: statusFilter } : undefined)

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
              statusFilter === f.value
                ? 'bg-white/[0.08] text-[#FAFAFA]'
                : 'border border-white/10 bg-[#0F0F0F] text-[#A0A0A0] hover:border-white/[0.15]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : applications.length === 0 ? (
        <EmptyState icon={FileCheck} title="No applications" description="Applications appear once you add an account" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Account', 'Company', 'Status', 'Applied At', 'Units', 'Result'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#707070]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app: Record<string, unknown>) => (
                  <>
                    <tr
                      key={app.id as string}
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id as string)}
                      className={clsx(
                        'cursor-pointer border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]',
                        expandedId === app.id && 'bg-white/[0.02]',
                      )}
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-[#FAFAFA]">
                        ····{(app.account as Record<string, string>)?.boid?.slice(-6) ?? '??????'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#FAFAFA]">
                        {(app.issue as Record<string, string>)?.scrip}
                      </td>
                      <td className="px-4 py-3">
                        {app.status === 'APPLYING' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                            <Loader2 size={10} className="animate-spin" strokeWidth={2} />
                            Applying
                          </span>
                        ) : (
                          <StatusBadge color={getStatusColor(app.status as string)} label={getStatusLabel(app.status as string)} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">
                        {app.appliedAt ? format(new Date(app.appliedAt as string), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#A0A0A0]">{app.appliedKitta as number}</td>
                      <td className="px-4 py-3 text-[13px] text-[#707070]">
                        {app.allottedKitta != null ? `${app.allottedKitta} units` : '—'}
                      </td>
                    </tr>
                    {expandedId === app.id && app.errorMessage && (
                      <tr className="border-b border-white/5 bg-red-500/[0.04]">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-[12px] text-red-400">{app.errorMessage as string}</p>
                          <p className="mt-0.5 text-[11px] text-[#707070]">Retries: {app.retryCount as number}</p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
