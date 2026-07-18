const ZERO_DECIMAL_CURRENCIES = new Set(['cop'])

export function getCurrencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? 0 : 2
}

// Negative amounts are conveyed with color by callers, not a "-" sign, so
// this always formats the magnitude.
export function formatMoney(amount: number, currency: string): string {
  const decimals = getCurrencyDecimals(currency)
  return Math.abs(amount).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Values coming from the server are canonical number strings (period
// decimal, e.g. "1234.56", via String(number)) — distinct from the
// comma-decimal, dot-grouped strings the input displays while typing.
export function formatStoredAmount(value: string, decimals = 2): string {
  const num = parseFloat(value)
  if (Number.isNaN(num)) return ''
  return num.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function cleanCurrencyInput(value: string, decimals = 2): string {
  const cleaned = value.replace(/[^\d,]/g, '')
  if (decimals === 0) {
    return cleaned.replace(/,/g, '')
  }
  const firstComma = cleaned.indexOf(',')
  const withSingleComma =
    firstComma === -1
      ? cleaned
      : cleaned.slice(0, firstComma + 1) +
        cleaned.slice(firstComma + 1).replace(/,/g, '')
  const [intPart, decPart] = withSingleComma.split(',')
  const limitedDec =
    decPart !== undefined ? decPart.slice(0, decimals) : undefined
  return limitedDec !== undefined ? `${intPart},${limitedDec}` : intPart
}

export function formatCurrencyInput(value: string, decimals = 2): string {
  const cleaned = cleanCurrencyInput(value, decimals)
  const [intPart, decPart] = cleaned.split(',')
  const withDots = (intPart || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decPart !== undefined ? `${withDots},${decPart}` : withDots
}

export function parseCurrencyInput(value: FormDataEntryValue | null): number {
  const normalized = String(value ?? '')
    .replace(/\./g, '')
    .replace(',', '.')
  return parseFloat(normalized)
}

export function parseOptionalCurrencyInput(
  value: FormDataEntryValue | null
): number | null {
  if (!String(value ?? '').trim()) return null
  const parsed = parseCurrencyInput(value)
  return Number.isNaN(parsed) ? null : parsed
}
