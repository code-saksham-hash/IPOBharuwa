'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/common/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    result?.error ? setError('Invalid email or password') : (router.push('/dashboard'), router.refresh())
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-[360px]">
        <div className="text-center">
          <h1 className="text-base font-semibold text-[#FAFAFA]">IPOBaje</h1>
          <p className="mt-1 text-[12px] text-[#A3A3A3]">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#A3A3A3]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9 w-full rounded-lg border border-[#262626] bg-[#171717] px-3 text-[13px] text-[#FAFAFA] placeholder-[#737373] outline-none focus:border-[#404040]" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#A3A3A3]">Password</label>
            <PasswordInput value={password} onChange={setPassword} placeholder="Your password" className="h-9 rounded-lg bg-[#171717]" />
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="h-9 w-full rounded-lg bg-[#FAFAFA] text-[13px] font-medium text-[#0A0A0A] transition-all duration-150 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-[12px] text-[#A3A3A3]">
          Don&apos;t have an account? <Link href="/register" className="text-[#FAFAFA] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
