'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  allotted: number
  notAllotted: number
  pending: number
  isLoading?: boolean
}

export function DonutChart({ allotted, notAllotted, pending, isLoading }: DonutChartProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
        <div className="mb-3 h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-[180px] w-[180px] animate-pulse rounded-full bg-white/[0.04]" />
      </div>
    )
  }

  const total = allotted + notAllotted + pending
  const successRate = total > 0 ? Math.round((allotted / total) * 100) : 0

  const data = [
    { name: 'Allotted', value: allotted, fill: '#ffffff' },
    { name: 'Not Allotted', value: notAllotted, fill: '#444444' },
    { name: 'Pending', value: pending, fill: '#222222' },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
        <h3 className="mb-4 text-[13px] font-medium text-white">Allotment Breakdown</h3>
        <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border border-[#1A1A1A]">
          <span className="text-[13px] text-[#666666]">No data</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-6">
      <h3 className="mb-2 text-[13px] font-medium text-white">Allotment Breakdown</h3>
      <div className="relative" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-semibold text-white">{successRate}%</span>
          <span className="text-[10px] text-[#666666]">success</span>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex gap-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.fill }} />
            <span className="text-[11px] text-[#666666]">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
