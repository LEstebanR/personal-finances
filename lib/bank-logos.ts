const KNOWN_INSTITUTIONS: { keywords: string[]; domain: string }[] = [
  { keywords: ['bancolombia'], domain: 'bancolombia.com' },
  { keywords: ['nequi'], domain: 'nequi.com.co' },
  { keywords: ['davivienda'], domain: 'davivienda.com' },
  { keywords: ['daviplata'], domain: 'daviplata.com' },
  { keywords: ['banco de bogota', 'bancodebogota'], domain: 'bancodebogota.com' },
  { keywords: ['bbva'], domain: 'bbva.com.co' },
  { keywords: ['banco popular'], domain: 'bancopopular.com.co' },
  { keywords: ['caja social'], domain: 'bancocajasocial.com' },
  { keywords: ['colpatria', 'scotiabank'], domain: 'scotiabankcolpatria.com' },
  { keywords: ['banco agrario'], domain: 'bancoagrario.gov.co' },
  { keywords: ['av villas', 'avvillas'], domain: 'avvillas.com.co' },
  { keywords: ['itau', 'itaú'], domain: 'itau.co' },
  { keywords: ['nubank', 'nu bank', ' nu '], domain: 'nu.com.co' },
  { keywords: ['lulo bank', 'lulobank'], domain: 'lulobank.com' },
  { keywords: ['rappipay', 'rappi pay'], domain: 'rappipay.co' },
  { keywords: ['bancoomeva', 'coomeva'], domain: 'bancoomeva.com.co' },
  { keywords: ['banco falabella', 'falabella'], domain: 'bancofalabella.com.co' },
  { keywords: ['powwi'], domain: 'powwi.com' },
  { keywords: ['paypal'], domain: 'paypal.com' },
  { keywords: ['visa'], domain: 'visa.com' },
  { keywords: ['mastercard'], domain: 'mastercard.com' },
  { keywords: ['american express', 'amex'], domain: 'americanexpress.com' },
]

// Matches an account name against a small set of known Colombian/LatAm
// banks and fintechs, then points at a public logo API (same technique
// apps like Mint/Plaid use) instead of us storing copies of trademarked
// logos ourselves.
export function suggestLogoUrl(accountName: string): string | null {
  const normalized = ` ${accountName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')} `

  let bestMatch: { domain: string; keywordLength: number } | null = null

  for (const institution of KNOWN_INSTITUTIONS) {
    for (const keyword of institution.keywords) {
      if (normalized.includes(keyword)) {
        if (!bestMatch || keyword.length > bestMatch.keywordLength) {
          bestMatch = { domain: institution.domain, keywordLength: keyword.length }
        }
      }
    }
  }

  return bestMatch
    ? `https://www.google.com/s2/favicons?domain=${bestMatch.domain}&sz=128`
    : null
}

export const ACCOUNT_COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#64748b',
]
