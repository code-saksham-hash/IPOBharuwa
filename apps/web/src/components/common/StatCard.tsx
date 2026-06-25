interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-6">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">
        {label}
      </p>
      <p className="mt-2 text-[32px] font-semibold leading-none text-[#FAFAFA]">
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 text-[12px] text-[#707070]">{subtitle}</p>
      )}
    </div>
  )
}
