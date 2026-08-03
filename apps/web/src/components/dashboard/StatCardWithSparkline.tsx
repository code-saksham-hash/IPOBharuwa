'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklinePoint {
  month: string
  value: number
}

interface StatCardWithSparklineProps {
  label: string
  value: string | number
  sparklineData: SparklinePoint[]
  subtitle?: string
  isLoading?: boolean
}

export function StatCardWithSparkline({
  label,
  value,
  sparklineData,
  subtitle,
  isLoading,
}: StatCardWithSparklineProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-5">
        <div className="mb-3 h-3 w-20 rounded bg-white/[0.06]" />
        <div className="mb-3 h-7 w-16 rounded bg-white/[0.08]" />
        <div className="h-10 w-full rounded bg-white/[0.04]" />
      </div>
    )
  }

  const hasData = sparklineData.length > 0

  return (
    <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-5">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#666666]">
        {label}
      </div>
      <div className="mb-3 text-[24px] font-semibold text-white">{value}</div>

      {/* Sparkline */}
      <div className="h-10 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-end">
            <div className="h-px w-full bg-[#1A1A1A]" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-[11px] text-[#666666]">{subtitle}</div>
      )}
    </div>
  )
}
