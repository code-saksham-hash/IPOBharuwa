'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  id?: string
  autoComplete?: string
}

export function PasswordInput({ value, onChange, placeholder, className, maxLength, id, autoComplete }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={clsx(
          'h-10 w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 pr-10 text-[13px] text-[#FAFAFA] placeholder-[#707070] outline-none transition-colors focus:border-white/[0.20]',
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] transition-all duration-150 hover:text-[#A3A3A3]"
      >
        {show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
      </button>
    </div>
  )
}
