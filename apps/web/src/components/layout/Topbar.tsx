'use client'

import { Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/ipos': 'IPOs',
  '/dashboard/applications': 'Applications',
  '/dashboard/portfolio': 'Portfolio',
  '/dashboard/accounts': 'Accounts',
  '/dashboard/settings': 'Settings',
}

export function Topbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const title = PAGE_TITLES[pathname] ?? 'Dashboard'
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')
  const initials = (session?.user?.name ?? session?.user?.email ?? '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A0A0A] px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-[14px] font-medium text-[#FAFAFA]">{title}</h2>
        <span className="text-[11px] text-[#707070] hidden sm:inline">{today}</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-1.5 text-[#A0A0A0] transition-colors hover:bg-white/[0.04] hover:text-[#E0E0E0]">
          <Bell size={16} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white ring-2 ring-[#0A0A0A]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-medium text-[#A0A0A0]">
          {initials}
        </div>
      </div>
    </header>
  )
}
