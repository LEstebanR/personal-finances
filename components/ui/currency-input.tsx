'use client'

import { useCurrency } from '@/components/currency-provider'
import { formatCurrencyInput, getCurrencyDecimals } from '@/lib/currency'
import { useState } from 'react'

import { Input } from './input'

interface CurrencyInputProps {
  name: string
  id?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
}

export function CurrencyInput({
  name,
  id,
  required,
  defaultValue,
  placeholder,
}: CurrencyInputProps) {
  const currency = useCurrency()
  const decimals = getCurrencyDecimals(currency)
  const [value, setValue] = useState(
    defaultValue ? formatCurrencyInput(defaultValue, decimals) : ''
  )

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        $
      </span>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        required={required}
        placeholder={placeholder ?? (decimals === 0 ? '0' : '0.00')}
        value={value}
        onChange={(e) =>
          setValue(formatCurrencyInput(e.target.value, decimals))
        }
        className="pl-6"
      />
    </div>
  )
}
