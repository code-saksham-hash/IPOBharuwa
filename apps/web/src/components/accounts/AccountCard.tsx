'use client'

import { useState } from 'react'
import { Trash2, User, Hash, Building2, CreditCard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  }
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export function AccountCard({ account, onToggle, onDelete }: AccountCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const maskedBoid = `····${account.boid.slice(-4)}`
  const lastApplied = account.lastAppliedAt
    ? formatDistanceToNow(new Date(account.lastAppliedAt), { addSuffix: true })
    : 'Never'

  return (
    <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-medium text-[#FAFAFA]">{maskedBoid}</p>
          <p className="mt-0.5 text-[12px] text-[#A0A0A0]">{account.dpName}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(account.id, !account.isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
              account.isActive ? 'bg-white/[0.15]' : 'bg-white/[0.06]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                account.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(account.id); setConfirmDelete(false) }}
                className="rounded-md px-2 py-0.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-0.5 text-[11px] text-[#A0A0A0] transition-colors hover:bg-white/[0.04]">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="rounded-lg p-1.5 text-[#606060] transition-colors hover:text-red-400">
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <User size={12} strokeWidth={1.5} className="text-[#707070]" />
          <span className="text-[13px] font-medium text-[#FAFAFA]">{account.fullName ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 size={12} strokeWidth={1.5} className="text-[#707070]" />
          <span className="text-[12px] text-[#A0A0A0]">{account.bankName ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard size={12} strokeWidth={1.5} className="text-[#707070]" />
          <span className="text-[12px] text-[#A0A0A0]">
            {account.accountNumber ? `A/C ····${account.accountNumber.slice(-4)}` : 'A/C —'}
            {account.accountBranchId != null && <span className="ml-1 text-[11px] text-[#707070]">· Branch #{account.accountBranchId}</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={12} strokeWidth={1.5} className="text-[#707070]" />
          <span className="text-[12px] text-[#A0A0A0]">{account.crnNumber ? `CRN ${account.crnNumber}` : 'CRN —'}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-white/5 pt-3">
        <span className="text-[11px] text-[#707070]">Last applied: {lastApplied}</span>
      </div>
    </div>
  )
}
