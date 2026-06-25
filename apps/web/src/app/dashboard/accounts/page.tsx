'use client'

import { useState } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { AccountCard } from '@/components/accounts/AccountCard'
import { AddAccountModal } from '@/components/accounts/AddAccountModal'
import { EmptyState } from '@/components/common/EmptyState'
import { Users, Plus } from 'lucide-react'

export default function AccountsPage() {
  const { accounts, mutate } = useAccounts()
  const [showAddModal, setShowAddModal] = useState(false)

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    mutate()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-[#FAFAFA]">Linked Accounts</h3>
          <p className="text-[12px] text-[#707070]">{accounts.length} account(s) linked</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0F0F0F] px-4 py-2 text-[13px] font-medium text-[#E0E0E0] transition-colors hover:border-white/[0.15]"
        >
          <Plus size={15} strokeWidth={1.5} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon={Users} title="No accounts linked" description="Add a MeroShare account to get started" action={{ label: 'Add account', onClick: () => setShowAddModal(true) }} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {accounts.map((account: Record<string, unknown>) => (
            <AccountCard
              key={account.id as string}
              account={account as Parameters<typeof AccountCard>[0]['account']}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdded={mutate} />
    </div>
  )
}
