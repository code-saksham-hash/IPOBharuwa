import clsx from 'clsx'

type StatusColor = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'purple'

const STATUS_COLORS: Record<StatusColor, string> = {
  green:  'bg-emerald-500/10 text-emerald-400',
  amber:  'bg-amber-500/10 text-amber-400',
  red:    'bg-red-500/10 text-red-400',
  gray:   'bg-white/5 text-[#A0A0A0]',
  blue:   'bg-blue-500/10 text-blue-400',
  purple: 'bg-violet-500/10 text-violet-400',
}

export function StatusBadge({ color, label }: { color: StatusColor; label: string }) {
  return (
    <span className={clsx(
      'inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium',
      STATUS_COLORS[color],
    )}>
      {label}
    </span>
  )
}

export function getStatusColor(status: string): StatusColor {
  switch (status) {
    case 'OPEN':
    case 'APPLIED':
    case 'ALLOTTED':
      return 'green'
    case 'APPLYING':
      return 'blue'
    case 'PENDING':
    case 'NOT_ALLOTTED':
      return 'gray'
    case 'FAILED':
    case 'CLOSED':
      return 'red'
    case 'CLOSING_SOON':
      return 'amber'
    case 'NEW_IPO_OPEN':
      return 'purple'
    default:
      return 'gray'
  }
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}
