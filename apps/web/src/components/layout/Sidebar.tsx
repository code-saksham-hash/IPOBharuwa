'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CandlestickChart, FileCheck, Briefcase, Users, Settings } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/ipos', label: 'IPOs', icon: CandlestickChart },
  { href: '/dashboard/applications', label: 'Applications', icon: FileCheck },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[200px] shrink-0 flex-col border-r border-white/5 bg-[#0A0A0A]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
        <h1 className="text-[15px] font-semibold text-[#FAFAFA]">IPOBaje</h1>
        <span className="inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-medium text-[#707070]">BETA</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-white/[0.06] text-[#FAFAFA]'
                  : 'text-[#A0A0A0] hover:bg-white/[0.03] hover:text-[#E0E0E0]',
              )}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 px-3 py-3 space-y-2">
        <Link
          href="/dashboard/settings"
          className={clsx(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
            pathname === '/dashboard/settings'
              ? 'bg-white/[0.06] text-[#FAFAFA]'
              : 'text-[#A0A0A0] hover:bg-white/[0.03] hover:text-[#E0E0E0]',
          )}
        >
          <Settings size={16} strokeWidth={1.5} />
          Settings
        </Link>

        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          <span className="text-[11px] text-[#707070]">Worker running</span>
        </div>
      </div>
    </aside>
  )
}
