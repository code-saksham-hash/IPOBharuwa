export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0F0F0F]">
      <div className="flex gap-4 border-b border-white/5 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-white/5 px-4 py-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 animate-pulse rounded bg-white/[0.04]" style={{ width: `${60 + ((c * 20) % 80)}px` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-[#0F0F0F] p-6">
      <div className="mb-3 h-3 w-20 rounded bg-white/[0.06]" />
      <div className="h-8 w-16 rounded bg-white/[0.04]" />
    </div>
  )
}
