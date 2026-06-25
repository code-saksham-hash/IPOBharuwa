'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CandlestickChart, FileCheck, Users } from 'lucide-react'
import clsx from 'clsx'

const MOBILE_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/ipos', label: 'IPOs', icon: CandlestickChart },
  { href: '/dashboard/applications', label: 'Apps', icon: FileCheck },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Users },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-white/5 bg-[#0A0A0A] md:hidden">
      {MOBILE_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
              isActive ? 'text-[#E0E0E0]' : 'text-[#707070]',
            )}
          >
            <item.icon size={18} strokeWidth={1.5} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
