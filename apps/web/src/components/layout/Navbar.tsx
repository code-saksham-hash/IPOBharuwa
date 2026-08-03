'use client'

import { signOut } from 'next-auth/react'
import { useAccounts } from '@/hooks/useAccounts'
import Link from 'next/link'

export function Navbar() {
  const { accounts, isLoading } = useAccounts()

  const fullName = accounts?.[0]?.fullName ?? null

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1A1A1A] bg-[#000000] px-6">
      {/* Left: Logo */}
      <Link href="/dashboard" className="text-[15px] font-semibold text-white hover:text-white">
        IPOPilot
      </Link>

      {/* Center: User's MeroShare full name */}
      <div className="text-[13px] text-[#666666]">
        {isLoading ? (
          <span className="inline-block h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
        ) : fullName ? (
          <span>{fullName}</span>
        ) : null}
      </div>

      {/* Right: Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-[13px] text-[#666666] transition-colors hover:text-white"
      >
        Logout
      </button>
    </header>
  )
}
