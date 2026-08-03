'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ChevronDown, User, Landmark, Zap, ArrowRight, CreditCard, Hash } from 'lucide-react'
import { PasswordInput } from '@/components/common/PasswordInput'

const PROXY_BASE = '/api/proxy/meroshare'

interface DP { id: number; code: string; name: string }
interface Bank { id: number; code: string; name: string }

type Step = 'form' | 'saving' | 'bank-details' | 'saving-bank'

interface FetchedProfile {
  boid: string
  fullName: string | null
  bankName: string | null
  accountNumber: string | null
  accountBranchId: number | null
  crnNumber: string | null
  clientCode: string | null
  email: string | null
  contact: string | null
  address: string | null
}

export function AddAccountModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [dps, setDps] = useState<DP[]>([])
  const [dpSearch, setDpSearch] = useState('')
  const [selectedDp, setSelectedDp] = useState<DP | null>(null)
  const [showDpList, setShowDpList] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [transactionPin, setTransactionPin] = useState('')
  const [saveError, setSaveError] = useState('')
  const [savedProfile, setSavedProfile] = useState<FetchedProfile | null>(null)
  const [savedAccountId, setSavedAccountId] = useState<string | null>(null)
  const [cdscToken, setCdscToken] = useState<string | null>(null)

  const [step, setStep] = useState<Step>('form')
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankSearch, setBankSearch] = useState('')
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [showBankList, setShowBankList] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [crnNumber, setCrnNumber] = useState('')
  const [bankError, setBankError] = useState('')
  const [bankSaved, setBankSaved] = useState(false)

  useEffect(() => {
    if (open && dps.length === 0) {
      fetch(`${PROXY_BASE}/capital/`, { headers: { Accept: 'application/json' } })
        .then((r) => r.json())
        .then((json) => setDps(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []))
        .catch(() => {})
    }
  }, [open, dps.length])

  useEffect(() => {
    if (!open) {
      setUsername(''); setPassword(''); setTransactionPin('')
      setSelectedDp(null); setSaveError('')
      setDpSearch(''); setSavedProfile(null); setSavedAccountId(null)
      setStep('form')
      setCdscToken(null)
      setBanks([]); setBankSearch(''); setSelectedBank(null); setShowBankList(false)
      setAccountNumber(''); setCrnNumber(''); setBankError(''); setBankSaved(false)
    }
  }, [open])

  useEffect(() => {
    if (step === 'bank-details' && banks.length === 0 && cdscToken) {
      const headers: Record<string, string> = { Accept: 'application/json' }
      headers['Authorization'] = cdscToken
      fetch(`${PROXY_BASE}/bank/`, { headers })
        .then((r) => r.json())
        .then((json) => {
          console.log('[AddAccount] /bank/ response:', json)
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
          setBanks(list)
        })
        .catch((err) => console.error('[AddAccount] /bank/ fetch error:', err))
    }
  }, [step, banks.length, cdscToken])

  const filteredDps = dps.filter((dp) => dp.name.toLowerCase().includes(dpSearch.toLowerCase()) || dp.code.includes(dpSearch))
  const filteredBanks = banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.includes(bankSearch))

  const handleSave = async () => {
    if (!selectedDp || !username || !password) return
    if (!/^\d{4}$/.test(transactionPin)) {
      setSaveError('Transaction PIN must be 4 digits — required to auto-apply for IPOs')
      return
    }
    setStep('saving'); setSaveError(''); setSavedProfile(null)

    try {
      let authRes: Response
      try {
        authRes = await fetch(`${PROXY_BASE}/auth/`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: selectedDp.id, username, password }),
        })
      } catch {
        setSaveError('Backend unreachable — is the dev server running?')
        setStep('form')
        return
      }
      const authJson = await authRes.json().catch(() => null)
      if (!authRes.ok || authJson?.error) {
        setSaveError(authJson?.error ?? `CDSC login failed (HTTP ${authRes.status})`)
        setStep('form')
        return
      }

      const dataBody = authJson.data as Record<string, unknown> | undefined
      const token =
        dataBody?.token as string | undefined ??
        authRes.headers.get('x-cdsc-token') ??
        undefined
      if (!token) {
        console.error('[AddAccount] Auth response data:', JSON.stringify(authJson))
        setSaveError('CDSC login succeeded but no token returned — check browser console')
        setStep('form')
        return
      }

      setCdscToken(token)
      console.log('[AddAccount] [Y]  CDSC token stored for step 2')

      let ownRes: Response
      try {
        ownRes = await fetch(`${PROXY_BASE}/ownDetail/`, {
          headers: { Accept: 'application/json', Authorization: token },
        })
      } catch {
        setSaveError('Backend unreachable — is the dev server running?')
        setStep('form')
        return
      }
      const ownJson = await ownRes.json().catch(() => null)
      if (!ownRes.ok || ownJson?.error) {
        setSaveError(ownJson?.error ?? `Failed to fetch profile from CDSC (HTTP ${ownRes.status})`)
        setStep('form')
        return
      }
      const ownData = (ownJson.data as Record<string, unknown>) ?? {}

      let saveRes: Response
      try {
        saveRes = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            dpId: selectedDp.id,
            dpName: selectedDp.name,
            password,
            transactionPin,
            boid: (ownData.demat as string) ?? (ownData.boid as string) ?? username,
            fullName: (ownData.name as string) ?? null,
            clientCode: (ownData.clientCode as string) ?? null,
            email: (ownData.meroShareEmail as string) ?? (ownData.email as string) ?? null,
            contact: (ownData.contact as string) ?? null,
            address: (ownData.address as string) ?? null,
          }),
        })
      } catch {
        setSaveError('Backend unreachable — is the dev server running?')
        setStep('form')
        return
      }

      const json = await saveRes.json().catch(() => null)
      if (!json || json.error) {
        setSaveError(json?.error ?? `Server error (HTTP ${saveRes.status})`)
        setStep('form')
        return
      }

      const acct = json.data as Record<string, unknown>
      setSavedAccountId(acct.id as string)
      setSavedProfile({
        boid: (acct.boid as string) ?? username,
        fullName: (acct.fullName as string) ?? null,
        bankName: null,
        accountNumber: null,
        accountBranchId: null,
        crnNumber: null,
        clientCode: (acct.clientCode as string) ?? null,
        email: (acct.email as string) ?? null,
        contact: (acct.contact as string) ?? null,
        address: (acct.address as string) ?? null,
      })

      onAdded()
      setStep('bank-details')

      // Best-effort — don't block the UI on this. The worker's cron will
      // eventually catch up even if CDSC blocks this immediate sync.
      fetch('/api/ipos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: acct.id }),
      }).catch((err) => console.error('[AddAccount] IPO sync failed:', err))
    } catch (err) {
      console.error('[AddAccount] Unexpected error:', err)
      setSaveError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`)
      setStep('form')
    }
  }

  const handleSaveBank = async () => {
    if (!savedAccountId) return
    setStep('saving-bank'); setBankError('')

    try {
      const res = await fetch(`/api/accounts/${savedAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: selectedBank?.id ?? null,
          bankName: selectedBank?.name ?? null,
          accountNumber: accountNumber || null,
          crnNumber: crnNumber || null,
          accountBranchId: selectedBank?.id ? null : null,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!json || json.error) {
        setBankError(json?.error ?? `Failed to save bank details (HTTP ${res.status})`)
        setStep('bank-details')
        return
      }

      const updated = json.data as Record<string, unknown>
      setSavedProfile((prev) => prev ? {
        ...prev,
        bankName: (updated.bankName as string) ?? selectedBank?.name ?? null,
        accountNumber: (updated.accountNumber as string) ?? (accountNumber || null),
        crnNumber: (updated.crnNumber as string) ?? (crnNumber || null),
      } : null)

      setBankSaved(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setBankError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`)
      setStep('bank-details')
    }
  }

  const handleSkipBank = () => {
    onClose()
  }

  if (!open) return null
  const canSave = selectedDp && username.length > 0 && password.length > 0 && /^\d{4}$/.test(transactionPin)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[480px] rounded-xl border border-white/10 bg-[#0F0F0F] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#FAFAFA]">
            {step === 'bank-details' || step === 'saving-bank'
              ? 'Bank Details'
              : 'Add Account'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#A0A0A0] transition-all duration-150 hover:bg-white/[0.03]">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────── */}
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-[11px] font-medium ${step === 'form' || step === 'saving' ? 'text-[#FAFAFA]' : 'text-[#525252]'}`}>
            ● Profile
          </span>
          <span className="text-[#404040]">—</span>
          <span className={`text-[11px] font-medium ${step === 'bank-details' || step === 'saving-bank' || bankSaved ? 'text-[#FAFAFA]' : 'text-[#525252]'}`}>
            ○ Bank
          </span>
        </div>

        {/* ── Step 1: CDSC login form ────────────────────────────────── */}
        {(step === 'form' || step === 'saving') && (
          <div className="mt-6 space-y-4">
            {/* DP Selector */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">Depository Participant</label>
              <div className="relative">
                <button onClick={() => setShowDpList(!showDpList)} className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-left text-[13px] transition-all duration-150 hover:border-[#404040]">
                  <span className={selectedDp ? 'font-medium text-[#FAFAFA]' : 'text-[#707070]'}>{selectedDp?.name ?? 'Search DPs...'}</span>
                  <ChevronDown size={14} strokeWidth={1.5} className="text-[#707070]" />
                </button>
                {showDpList && (
                  <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0F0F0F]">
                    <input type="text" value={dpSearch} onChange={(e) => setDpSearch(e.target.value)} placeholder="Type to filter..." className="w-full border-b border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-[13px] text-[#FAFAFA] outline-none" autoFocus />
                    {filteredDps.slice(0, 50).map((dp) => (
                      <button key={dp.id} onClick={() => { setSelectedDp(dp); setShowDpList(false); setDpSearch(''); setSavedProfile(null) }} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] transition-all duration-150 hover:bg-white/[0.03]">
                        <span className="font-medium text-[#FAFAFA]">{dp.name}</span>
                        <span className="text-[11px] text-[#707070]">{dp.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Username / BOID */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">MeroShare Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value.trim()); setSavedProfile(null) }}
                placeholder="e.g. 00025411 or 1301010000123456"
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-[13px] text-[#FAFAFA] placeholder-[#707070] outline-none transition-all duration-150 focus:border-[#404040]"
              />
              <p className="mt-1 text-[11px] text-[#707070]">Your MeroShare login username or 16-digit BOID</p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">Password</label>
              <PasswordInput value={password} onChange={(v) => { setPassword(v); setSavedProfile(null) }} placeholder="MeroShare login password" />
            </div>

            {/* Transaction PIN */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">
                Transaction PIN <span className="text-red-400">*</span>
              </label>
              <PasswordInput value={transactionPin} onChange={(v) => setTransactionPin(v.replace(/\D/g, '').slice(0, 4))} placeholder="4-digit PIN" maxLength={4} />
              <p className="mt-1 text-[11px] text-[#707070]">
                Required to submit applications — different from your password. Set on MeroShare under My Profile → Edit Transaction PIN.
              </p>
            </div>

            {/* Error */}
            {saveError && <p className="text-[12px] font-medium text-red-400">{saveError}</p>}

            {/* Save button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={handleSave}
                disabled={!canSave || step === 'saving'}
                className="rounded-xl bg-[#FAFAFA] px-5 py-2.5 text-[13px] font-semibold text-[#0A0A0A] transition-all duration-150 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 'saving' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    Save & Continue
                    <ArrowRight size={14} strokeWidth={2} />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Bank details form ────────────────────────────────── */}
        {(step === 'bank-details' || step === 'saving-bank') && (
          <div className="mt-6 space-y-4">
            {/* Profile summary card */}
            {savedProfile && (
              <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#A0A0A0]">[Y]  Account saved</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-[#A0A0A0]">
                    <Zap size={10} strokeWidth={2} />
                    Step 1 of 2
                  </span>
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-3">
                  {savedProfile.fullName && (
                    <div className="flex items-center gap-2">
                      <User size={12} strokeWidth={1.5} className="text-[#707070]" />
                      <span className="text-[12px] font-medium text-[#FAFAFA]">{savedProfile.fullName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#707070]">BOID</span>
                    <span className="text-[11px] text-[#A0A0A0]">{savedProfile.boid}</span>
                  </div>
                </div>
              </div>
            )}

            {bankSaved ? (
              <div className="rounded-xl border border-white/10 bg-[#0F0F0F] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#A0A0A0]">[Y]  Bank details saved</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-[#A0A0A0]">
                    <Zap size={10} strokeWidth={2} />
                    Ready to auto-apply
                  </span>
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-3">
                  {savedProfile?.bankName && (
                    <div className="flex items-center gap-2">
                      <Landmark size={12} strokeWidth={1.5} className="text-[#707070]" />
                      <span className="text-[12px] font-medium text-[#FAFAFA]">{savedProfile.bankName}</span>
                    </div>
                  )}
                  {savedProfile?.accountNumber && (
                    <div className="flex items-center gap-2">
                      <CreditCard size={12} strokeWidth={1.5} className="text-[#707070]" />
                      <span className="text-[12px] text-[#A0A0A0]">A/C ····{savedProfile.accountNumber.slice(-4)}</span>
                    </div>
                  )}
                  {savedProfile?.crnNumber && (
                    <div className="flex items-center gap-2">
                      <Hash size={12} strokeWidth={1.5} className="text-[#707070]" />
                      <span className="text-[12px] text-[#A0A0A0]">CRN {savedProfile.crnNumber}</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[#707070]">Closing automatically...</p>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-[#A0A0A0] leading-relaxed">
                  Bank details are <strong className="text-[#FAFAFA]">required</strong> for IPO applications.
                  Find them on MeroShare at <span className="text-[#A0A0A0]">Settings → My Profile → Bank Details</span>.
                </p>

                {/* Bank dropdown */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">
                    Bank <span className="text-red-400">*</span>
                  </label>
                  <p className="mb-1 text-[11px] text-[#707070]">
                    MeroShare → My Profile → Bank Details → "Bank Name"
                  </p>
                  <div className="relative">
                    <button
                      onClick={() => setShowBankList(!showBankList)}
                      className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-left text-[13px] transition-all duration-150 hover:border-[#404040]"
                    >
                      <span className={selectedBank ? 'font-medium text-[#FAFAFA]' : 'text-[#707070]'}>
                        {selectedBank?.name ?? 'Select your bank...'}
                      </span>
                      <ChevronDown size={14} strokeWidth={1.5} className="text-[#707070]" />
                    </button>
                    {showBankList && (
                      <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0F0F0F]">
                        <input
                          type="text"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Type to filter..."
                          className="w-full border-b border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-[13px] text-[#FAFAFA] outline-none"
                          autoFocus
                        />
                        {filteredBanks.slice(0, 50).map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => { setSelectedBank(bank); setShowBankList(false); setBankSearch('') }}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] transition-all duration-150 hover:bg-white/[0.03]"
                          >
                            <span className="font-medium text-[#FAFAFA]">{bank.name}</span>
                            <span className="text-[11px] text-[#707070]">{bank.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">
                    Account Number <span className="text-red-400">*</span>
                  </label>
                  <p className="mb-1 text-[11px] text-[#707070]">
                    MeroShare → My Profile → Bank Details → "Account Number"
                  </p>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.trim())}
                    placeholder="e.g. 01901000001234"
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-[13px] text-[#FAFAFA] placeholder-[#707070] outline-none transition-all duration-150 focus:border-[#404040]"
                  />
                </div>

                {/* CRN Number */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">
                    CRN Number <span className="text-red-400">*</span>
                  </label>
                  <p className="mb-1 text-[11px] text-[#707070]">
                    MeroShare → My Profile → Bank Details → "CRN Number"
                  </p>
                  <input
                    type="text"
                    value={crnNumber}
                    onChange={(e) => setCrnNumber(e.target.value.trim())}
                    placeholder="e.g. 0012345678"
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-[13px] text-[#FAFAFA] placeholder-[#707070] outline-none transition-all duration-150 focus:border-[#404040]"
                  />
                </div>

                {/* Error */}
                {bankError && <p className="text-[12px] font-medium text-red-400">{bankError}</p>}

                {/* Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleSkipBank}
                    className="text-[12px] text-[#707070] transition-all duration-150 hover:text-[#A0A0A0]"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleSaveBank}
                    disabled={step === 'saving-bank'}
                    className="rounded-xl bg-[#FAFAFA] px-5 py-2.5 text-[13px] font-semibold text-[#0A0A0A] transition-all duration-150 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {step === 'saving-bank' ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Bank Details'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
