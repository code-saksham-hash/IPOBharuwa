'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PasswordInput } from '@/components/common/PasswordInput'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  return (
    <div className="max-w-xl space-y-8">
      <section>
        <h3 className="text-[14px] font-medium text-[#FAFAFA]">Account</h3>
        <div className="mt-3 rounded-xl border border-white/10 bg-[#0F0F0F] p-5">
          <p className="text-[14px] font-medium text-[#FAFAFA]">{session?.user?.email}</p>
          <p className="mt-0.5 text-[12px] text-[#A0A0A0]">{session?.user?.name}</p>
        </div>
      </section>

      <section>
        <h3 className="text-[14px] font-medium text-[#FAFAFA]">Change Password</h3>
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-[#0F0F0F] p-5">
          <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" />
          <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="New password" />
          <button className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-[#E0E0E0] transition-colors hover:bg-white/[0.10]">
            Update Password
          </button>
          {passwordMsg && <p className="text-[12px] text-[#A0A0A0]">{passwordMsg}</p>}
        </div>
      </section>

      <section>
        <h3 className="text-[14px] font-medium text-red-400">Danger Zone</h3>
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-[#0F0F0F] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#FAFAFA]">Remove all accounts</p>
              <p className="text-[11px] text-[#707070]">Delete all linked MeroShare accounts and their applications</p>
            </div>
            <button className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10">
              Remove all
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <p className="text-[13px] font-medium text-[#FAFAFA]">Delete my account</p>
              <p className="text-[11px] text-[#707070]">Permanently delete your IPOBaje account and all data</p>
            </div>
            <button className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10">
              Delete account
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
