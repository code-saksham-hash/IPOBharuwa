import { SessionProvider } from '@/components/common/SessionProvider'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { LayoutDashboard, History, CandlestickChart, CreditCard, Settings } from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/ipos', label: 'IPOs', icon: CandlestickChart },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-[#000000]">
        <Navbar />

        {/* Thin nav strip */}
        <nav className="flex h-9 items-center gap-1 border-b border-[#1A1A1A] px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] text-[#666666] transition-colors hover:text-white"
            >
              <link.icon className="h-3 w-3" />
              {link.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </SessionProvider>
  )
}
