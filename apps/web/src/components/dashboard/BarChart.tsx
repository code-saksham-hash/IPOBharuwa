'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'

interface MonthlyBar {
  month: string
  applications: number
  allotments: number
}

interface MonthlyBarChartProps {
  data: MonthlyBar[]
  isLoading?: boolean
}

// Format "2026-01" → "Jan"
function monthLabel(month: string): string {
  const [y, m] = month.split('-')
  const date = new Date(parseInt(y!), parseInt(m!) - 1)
  return date.toLocaleString('en-US', { month: 'short' })
}

export function MonthlyBarChart({ data, isLoading }: MonthlyBarChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
        <div className="mb-4 h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-[200px] w-full animate-pulse rounded bg-white/[0.04]" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
        <h3 className="mb-4 text-[13px] font-medium text-white">Monthly Breakdown</h3>
        <div className="flex h-[200px] w-full items-center justify-center">
          <span className="text-[13px] text-[#666666]">No data yet</span>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, monthLabel: monthLabel(d.month) }))

  return (
    <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
      <h3 className="mb-4 text-[13px] font-medium text-white">Monthly Breakdown</h3>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} barSize={8} barGap={2}>
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666666', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666666', fontSize: 11 }}
              allowDecimals={false}
            />
            <Bar dataKey="applications" fill="#ffffff" opacity={0.15} radius={[1, 1, 0, 0]} />
            <Bar dataKey="allotments" fill="#ffffff" radius={[1, 1, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-white opacity-15" />
          <span className="text-[11px] text-[#666666]">Applications</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-white" />
          <span className="text-[11px] text-[#666666]">Allotments</span>
        </div>
      </div>
    </div>
  )
}
