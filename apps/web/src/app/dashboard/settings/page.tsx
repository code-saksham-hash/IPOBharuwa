'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAccounts } from '@/hooks/useAccounts'
import { PasswordInput } from '@/components/common/PasswordInput'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { accounts, mutate: mutateAccounts } = useAccounts()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false)
  const [removingAll, setRemovingAll] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleChangePassword = async () => {
    setPasswordMsg('')
    setPasswordSaving(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json || json.error) {
        setPasswordMsg(json?.error ?? `Failed (HTTP ${res.status})`)
        return
      }
      setPasswordMsg('Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRemoveAllAccounts = async () => {
    setRemovingAll(true)
    try {
      await Promise.all(
        accounts.map((a: Record<string, unknown>) => fetch(`/api/accounts/${a.id}`, { method: 'DELETE' })),
      )
      mutateAccounts()
      setConfirmRemoveAll(false)
    } finally {
      setRemovingAll(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json || json.error) {
        setDeleteError(json?.error ?? `Failed (HTTP ${res.status})`)
        return
      }
      await signOut({ callbackUrl: '/login' })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setDeleting(false)
    }
  }

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
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving || !currentPassword || newPassword.length < 6}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-[#E0E0E0] transition-colors hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
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
            {confirmRemoveAll ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={handleRemoveAllAccounts}
                  disabled={removingAll}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  {removingAll ? 'Removing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmRemoveAll(false)}
                  className="rounded-lg px-3 py-1.5 text-[12px] text-[#707070] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemoveAll(true)}
                disabled={accounts.length === 0}
                className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove all
              </button>
            )}
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#FAFAFA]">Delete my account</p>
                <p className="text-[11px] text-[#707070]">Permanently delete your IPOPilot account and all data</p>
              </div>
              {!showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete account
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mt-3 space-y-2">
                <p className="text-[12px] text-[#A0A0A0]">Enter your password to confirm — this cannot be undone.</p>
                <PasswordInput value={deletePassword} onChange={setDeletePassword} placeholder="Password" />
                {deleteError && <p className="text-[12px] font-medium text-red-400">{deleteError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deleting ? 'Deleting...' : 'Permanently delete'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError('') }}
                    className="rounded-lg px-3 py-1.5 text-[12px] text-[#707070] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
