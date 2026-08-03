export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1A1A1A] bg-[#0D0D0D]">
      <div className="flex gap-4 border-b border-[#1A1A1A] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-[#1A1A1A] px-4 py-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 animate-pulse rounded bg-white/[0.04]" style={{ width: `${60 + ((c * 20) % 80)}px` }} />
          ))}
        </div>
      ))}
    </div>
  )
}
