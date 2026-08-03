'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export interface IPOPrefill {
  detectedIssueId: string
  companyName: string
  shareTypeRaw: string | null
  openDate: string
  closeDate: string
  estimatedPrice: number | null
}

function guessShareType(raw: string | null): string {
  if (!raw) return 'IPO'
  const upper = raw.toUpperCase()
  if (upper.includes('FPO')) return 'FPO'
  if (upper.includes('RIGHT')) return 'RIGHT'
  return 'IPO'
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export function AddIPOModal({
  open,
  onClose,
  onAdded,
  prefill,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
  prefill?: IPOPrefill | null
}) {
  const [companyShareId, setCompanyShareId] = useState('')
  const [scrip, setScrip] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [shareType, setShareType] = useState('IPO')
  const [shareGroup, setShareGroup] = useState('Ordinary')
  const [openDate, setOpenDate] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [issuePrice, setIssuePrice] = useState('100')
  const [minUnit, setMinUnit] = useState('10')
  const [maxUnit, setMaxUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setCompanyShareId(''); setScrip(''); setCompanyName('')
    setShareType('IPO'); setShareGroup('Ordinary')
    setOpenDate(''); setCloseDate('')
    setIssuePrice('100'); setMinUnit('10'); setMaxUnit('')
    setError('')
  }

  useEffect(() => {
    if (open && prefill) {
      setCompanyName(prefill.companyName)
      setShareType(guessShareType(prefill.shareTypeRaw))
      setOpenDate(toDateInputValue(prefill.openDate))
      setCloseDate(toDateInputValue(prefill.closeDate))
      if (prefill.estimatedPrice) setIssuePrice(String(Math.round(prefill.estimatedPrice)))
    }
  }, [open, prefill])

  const canSave =
    companyShareId.trim().length > 0 &&
    scrip.trim().length > 0 &&
    companyName.trim().length > 0 &&
    openDate.length > 0 &&
    closeDate.length > 0 &&
    issuePrice.trim().length > 0 &&
    minUnit.trim().length > 0 &&
    maxUnit.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/ipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyShareId: Number(companyShareId),
          scrip: scrip.trim().toUpperCase(),
          companyName: companyName.trim(),
          shareType,
          shareGroup,
          openDate: new Date(openDate).toISOString(),
          closeDate: new Date(closeDate).toISOString(),
          issuePrice: Number(issuePrice),
          minUnit: Number(minUnit),
          maxUnit: Number(maxUnit),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json || json.error) {
        setError(json?.error ?? `Failed to save (HTTP ${res.status})`)
        return
      }

      if (prefill?.detectedIssueId) {
        await fetch(`/api/ipos/detected/${prefill.detectedIssueId}`, { method: 'DELETE' }).catch(() => {})
      }

      onAdded()
      reset()
      onClose()
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[480px] rounded-xl border border-white/10 bg-[#0F0F0F] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#FAFAFA]">Add IPO</h3>
          <button onClick={() => { onClose(); reset() }} className="rounded-lg p-1.5 text-[#A0A0A0] transition-all duration-150 hover:bg-white/[0.03]">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-[#A0A0A0]">
          {prefill ? (
            <>Name, dates, and an estimated price were pre-filled from CDSC's public issue list.
              Fill in the <strong className="text-[#FAFAFA]">Company Share ID</strong>, scrip, and
              min/max unit from MeroShare's "Apply for Issue" page — CDSC doesn't publish those
              anywhere public.</>
          ) : (
            <>CDSC blocks automated discovery of new issues, so enter details from MeroShare's
              "Apply for Issue" page manually. The <strong className="text-[#FAFAFA]">Company Share ID</strong>{' '}
              is required and must match CDSC's own ID exactly, or auto-apply will fail.</>
          )}
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company Share ID *">
              <input type="number" value={companyShareId} onChange={(e) => setCompanyShareId(e.target.value)} placeholder="e.g. 1842" className={inputClass} />
            </Field>
            <Field label="Scrip *">
              <input type="text" value={scrip} onChange={(e) => setScrip(e.target.value)} placeholder="e.g. ABCL" className={inputClass} />
            </Field>
          </div>

          <Field label="Company Name *">
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Full company name" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Share Type">
              <select value={shareType} onChange={(e) => setShareType(e.target.value)} className={inputClass}>
                <option value="IPO">IPO</option>
                <option value="FPO">FPO</option>
                <option value="RIGHT">RIGHT</option>
              </select>
            </Field>
            <Field label="Share Group">
              <select value={shareGroup} onChange={(e) => setShareGroup(e.target.value)} className={inputClass}>
                <option value="Ordinary">Ordinary</option>
                <option value="Promoter">Promoter</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Open Date *">
              <input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Close Date *">
              <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (NPR) *">
              <input type="number" value={issuePrice} onChange={(e) => setIssuePrice(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Min Unit *">
              <input type="number" value={minUnit} onChange={(e) => setMinUnit(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Max Unit *">
              <input type="number" value={maxUnit} onChange={(e) => setMaxUnit(e.target.value)} className={inputClass} />
            </Field>
          </div>

          {error && <p className="text-[12px] font-medium text-red-400">{error}</p>}

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="rounded-xl bg-[#FAFAFA] px-5 py-2.5 text-[13px] font-semibold text-[#0A0A0A] transition-all duration-150 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save & Queue Applications'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 text-[13px] text-[#FAFAFA] placeholder-[#707070] outline-none transition-all duration-150 focus:border-[#404040]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-[#A0A0A0]">{label}</label>
      {children}
    </div>
  )
}
