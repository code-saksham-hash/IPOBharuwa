'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PasswordInput } from '@/components/common/PasswordInput'

interface AccountCardProps {
  account: {
    id: string
    boid: string
    dpName: string
    fullName?: string | null
    bankName?: string | null
    accountNumber?: string | null
    crnNumber?: string | null
    accountBranchId?: number | null
    isActive: boolean
    lastAppliedAt?: string | null
    createdAt: string
    hasTransactionPin?: boolean
  }
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onSetPin: (id: string, pin: string) => Promise<void>
}

export function AccountCard({ account, onToggle, onDelete, onSetPin }: AccountCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingPin, setEditingPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinSaving, setPinSaving] = useState(false)
  const [pinError, setPinError] = useState('')
  const lastApplied = account.lastAppliedAt
    ? formatDistanceToNow(new Date(account.lastAppliedAt), { addSuffix: true })
    : 'Never'

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('PIN must be 4 digits')
      return
    }
    setPinSaving(true)
    setPinError('')
    try {
      await onSetPin(account.id, pinInput)
      setEditingPin(false)
      setPinInput('')
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to save PIN')
    } finally {
      setPinSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-white">
            {account.fullName ?? `BOID ····${account.boid.slice(-4)}`}
          </p>
          <p className="mt-0.5 text-[12px] text-[#666666]">{account.dpName}</p>
          {account.bankName && (
            <p className="text-[12px] text-[#666666]">{account.bankName}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Toggle */}
          <button
            onClick={() => onToggle(account.id, !account.isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
              account.isActive ? 'bg-white/[0.20]' : 'bg-white/[0.06]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 translate-y-0.5 rounded-full transition-transform ${
                account.isActive ? 'translate-x-[18px] bg-white' : 'translate-x-0.5 bg-[#444444]'
              }`}
            />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDelete(account.id)
                  setConfirmDelete(false)
                }}
                className="rounded px-2 py-0.5 text-[11px] text-[#444444] transition-colors hover:text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded px-2 py-0.5 text-[11px] text-[#666666] transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-[#444444] transition-colors hover:text-white"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-[#1A1A1A] pt-3">
        <span className="text-[11px] text-[#666666]">Last applied: {lastApplied}</span>
      </div>

      <div className="mt-3 border-t border-[#1A1A1A] pt-3">
        {editingPin ? (
          <div className="space-y-2">
            <PasswordInput
              value={pinInput}
              onChange={(v) => setPinInput(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              maxLength={4}
            />
            {pinError && <p className="text-[11px] font-medium text-red-400">{pinError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePin}
                disabled={pinSaving}
                className="rounded px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.06] disabled:opacity-40"
              >
                {pinSaving ? 'Saving...' : 'Save PIN'}
              </button>
              <button
                onClick={() => { setEditingPin(false); setPinInput(''); setPinError('') }}
                className="rounded px-2.5 py-1 text-[11px] text-[#666666] transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : account.hasTransactionPin ? (
          <button
            onClick={() => setEditingPin(true)}
            className="text-[11px] text-[#666666] transition-colors hover:text-white"
          >
            Update transaction PIN
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
              <AlertTriangle size={12} strokeWidth={1.5} />
              No PIN set — auto-apply will fail
            </span>
            <button
              onClick={() => setEditingPin(true)}
              className="shrink-0 rounded border border-[#1A1A1A] px-2.5 py-1 text-[11px] text-white transition-colors hover:border-[#333333]"
            >
              Set PIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
