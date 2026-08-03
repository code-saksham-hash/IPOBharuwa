'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useIPOs } from '@/hooks/useIPOs'
import { useAccounts } from '@/hooks/useAccounts'
import { StatCardWithSparkline } from '@/components/dashboard/StatCardWithSparkline'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { MonthlyBarChart } from '@/components/dashboard/BarChart'
import { OpenIPOsSection } from '@/components/dashboard/OpenIPOsSection'

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics()
  const { ipos, isLoading: iposLoading } = useIPOs()
  const { accounts, isLoading: accountsLoading } = useAccounts()

  const totals = analytics?.totals ?? {
    totalApplied: 0,
    totalAllotted: 0,
    totalPending: 0,
    totalFailed: 0,
    successRate: 0,
  }

  const monthlyData = analytics?.monthlyData ?? []

  // Last 6 months for sparklines
  const sparklineApplied = monthlyData.slice(-6).map((d) => ({ month: d.month, value: d.applications }))
  const sparklineAllotted = monthlyData.slice(-6).map((d) => ({ month: d.month, value: d.allotments }))
  const sparklineSuccess = monthlyData.slice(-6).map((d) => {
    const total = d.applications
    return { month: d.month, value: total > 0 ? Math.round((d.allotments / total) * 100) : 0 }
  })

  const activeSparkline = monthlyData.slice(-6).map((d) => ({
    month: d.month,
    value: (accounts as Array<{ isActive: boolean }>).filter((a) => a.isActive).length,
  }))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardWithSparkline
          label="Total Applied"
          value={totals.totalApplied}
          sparklineData={sparklineApplied}
          isLoading={analyticsLoading}
        />
        <StatCardWithSparkline
          label="Total Allotted"
          value={totals.totalAllotted}
          sparklineData={sparklineAllotted}
          isLoading={analyticsLoading}
        />
        <StatCardWithSparkline
          label="Success Rate"
          value={`${totals.successRate}%`}
          sparklineData={sparklineSuccess}
          subtitle={`${totals.totalAllotted} of ${totals.totalAllotted + totals.totalFailed} completed`}
          isLoading={analyticsLoading}
        />
        <StatCardWithSparkline
          label="Active Accounts"
          value={(accounts as Array<{ isActive: boolean }>).filter((a) => a.isActive).length}
          sparklineData={activeSparkline}
          subtitle={`${accounts.length} total`}
          isLoading={accountsLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart
          allotted={totals.totalAllotted}
          notAllotted={totals.totalFailed}
          pending={totals.totalPending}
          isLoading={analyticsLoading}
        />
        <MonthlyBarChart
          data={monthlyData.slice(-12)}
          isLoading={analyticsLoading}
        />
      </div>

      {/* Open IPOs */}
      <OpenIPOsSection ipos={ipos} isLoading={iposLoading} />
    </div>
  )
}
