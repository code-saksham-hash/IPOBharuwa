import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon size={24} className="text-[#404040]" strokeWidth={1.5} />
      </div>
      <p className="text-[13px] font-medium text-[#A0A0A0]">{title}</p>
      <p className="text-[12px] text-[#707070]">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-lg border border-white/10 bg-[#0F0F0F] px-4 py-2 text-[13px] font-medium text-[#A0A0A0] transition-colors hover:bg-white/[0.06]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
