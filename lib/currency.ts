const ZERO_DECIMAL_CURRENCIES = new Set(['cop'])

export function getCurrencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? 0 : 2
}

// Negative amounts are conveyed with color by callers, not a "-" sign, so
// this always formats the magnitude.
export function formatMoney(amount: number, currency: string): string {
  const decimals = getCurrencyDecimals(currency)
  return Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function cleanCurrencyInput(value: string, decimals = 2): string {
  const cleaned = value.replace(/[^\d.]/g, '')
  if (decimals === 0) {
    return cleaned.replace(/\./g, '')
  }
  const firstDot = cleaned.indexOf('.')
  const withSingleDot =
    firstDot === -1
      ? cleaned
      : cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '')
  const [intPart, decPart] = withSingleDot.split('.')
  const limitedDec =
    decPart !== undefined ? decPart.slice(0, decimals) : undefined
  return limitedDec !== undefined ? `${intPart}.${limitedDec}` : intPart
}

export function formatCurrencyInput(value: string, decimals = 2): string {
  const cleaned = cleanCurrencyInput(value, decimals)
  const [intPart, decPart] = cleaned.split('.')
  const withCommas = (intPart || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas
}

export function parseCurrencyInput(value: FormDataEntryValue | null): number {
  return parseFloat(String(value ?? '').replace(/,/g, ''))
}

export function parseOptionalCurrencyInput(
  value: FormDataEntryValue | null
): number | null {
  if (!String(value ?? '').trim()) return null
  const parsed = parseCurrencyInput(value)
  return Number.isNaN(parsed) ? null : parsed
}
