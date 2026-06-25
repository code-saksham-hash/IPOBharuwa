'use client'

import { useIPOs } from '@/hooks/useIPOs'
import { useAccounts } from '@/hooks/useAccounts'
import { useApplications } from '@/hooks/useApplications'
import { useNotifications } from '@/hooks/useNotifications'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { CandlestickChart, Bell, Check, X, Trophy, Clock } from 'lucide-react'
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns'
import Link from 'next/link'

function getEventIcon(type: string) {
  switch (type) {
    case 'AUTO_APPLY_SUCCESS': return Check
    case 'AUTO_APPLY_FAILED': return X
    case 'RESULT_ALLOTTED': return Trophy
    case 'RESULT_NOT_ALLOTTED': return X
    case 'NEW_IPO_OPEN': return Bell
    default: return Clock
  }
}

function getEventAccent(type: string): string {
  switch (type) {
    case 'AUTO_APPLY_SUCCESS':
    case 'RESULT_ALLOTTED':
      return 'text-emerald-400'
    case 'AUTO_APPLY_FAILED':
    case 'RESULT_NOT_ALLOTTED':
      return 'text-red-400'
    case 'NEW_IPO_OPEN':
      return 'text-blue-400'
    default:
      return 'text-[#A0A0A0]'
  }
}

export default function DashboardPage() {
  const { ipos, isLoading: iposLoading } = useIPOs()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { applications, totalCount } = useApplications()
  const { notifications, isLoading: notifsLoading } = useNotifications(10)

  const openIpos = ipos.filter((i: Record<string, unknown>) => i.status === 'OPEN')
  const allottedApps = applications.filter((a: Record<string, unknown>) => a.status === 'ALLOTTED')
  const successRate = totalCount > 0 ? Math.round((allottedApps.length / totalCount) * 100) : 0
  const activeAccounts = accounts.filter((a: Record<string, unknown>) => a.isActive).length

  const isLoading = iposLoading || accountsLoading

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Applied" value={totalCount} />
          <StatCard label="Allotted" value={allottedApps.length} />
          <StatCard label="Success Rate" value={`${successRate}%`} subtitle={`${allottedApps.length} of ${totalCount}`} />
          <StatCard label="Active Accounts" value={activeAccounts} subtitle={`${accounts.length} total`} />
        </div>
      )}

      {/* Open IPOs + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Open IPOs */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="text-[13px] font-medium text-[#FAFAFA]">Open Right Now</h3>
            {openIpos.length > 0 && (
              <span className="text-[11px] text-[#707070]">{openIpos.length} open</span>
            )}
          </div>

          {openIpos.length === 0 ? (
            <EmptyState icon={CandlestickChart} title="No open IPOs" description="New issues appear when detected by the worker" />
          ) : (
            openIpos.map((ipo: Record<string, unknown>) => {
              const closeDate = new Date(ipo.closeDate as string)
              const openDate = new Date(ipo.openDate as string)
              const now = new Date()
              const totalDays = differenceInDays(closeDate, openDate) || 1
              const daysElapsed = differenceInDays(now, openDate)
              const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))
              const hoursUntilClose = differenceInHours(closeDate, now)

              return (
                <Link
                  key={ipo.companyShareId as number}
                  href={`/dashboard/ipos/${ipo.id}`}
                  className="flex items-center gap-4 border-b border-white/5 px-5 py-4 transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[11px] font-medium text-[#A0A0A0]">
                    {(ipo.scrip as string).slice(0, 4)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#FAFAFA]">{ipo.companyName as string}</p>
                    <p className="text-[11px] text-[#707070]">
                      {ipo.shareType as string} · Min {(ipo.minUnit as number)} units · NPR {ipo.issuePrice as number}
                    </p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-white/[0.20]" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-[#707070]">
                      {hoursUntilClose < 0 ? 'Closed' : hoursUntilClose < 24 ? `${hoursUntilClose}h left` : `${Math.round(hoursUntilClose / 24)}d left`}
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </section>

        {/* Recent Activity */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
          <div className="border-b border-white/5 px-5 py-4">
            <h3 className="text-[13px] font-medium text-[#FAFAFA]">Recent Activity</h3>
          </div>

          {notifsLoading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 border-b border-white/5 px-5 py-3.5 last:border-b-0">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.04]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No activity yet" description="Notifications appear here" />
          ) : (
            notifications.map((n: Record<string, unknown>) => {
              const Icon = getEventIcon(n.type as string)
              const accent = getEventAccent(n.type as string)
              return (
                <div
                  key={n.id as string}
                  className="flex gap-3 border-b border-white/5 px-5 py-3.5 last:border-b-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                    <Icon size={14} className={accent} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#FAFAFA]">{n.title as string}</p>
                    <p className="text-[11px] text-[#707070]">{n.body as string}</p>
                    <p className="mt-0.5 text-[10px] text-[#606060]">
                      {formatDistanceToNow(new Date(n.createdAt as string), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/60" />
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
