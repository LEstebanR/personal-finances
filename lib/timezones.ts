export const timezones = Intl.supportedValuesOf('timeZone').sort()

export function groupTimezonesByRegion(): Record<string, string[]> {
  const groups: Record<string, string[]> = {}

  for (const timezone of timezones) {
    const region = timezone.includes('/') ? timezone.split('/')[0] : 'Other'
    if (!groups[region]) groups[region] = []
    groups[region].push(timezone)
  }

  return groups
}

export function formatTimezoneLabel(timezone: string): string {
  const parts = timezone.split('/')
  const city = parts[parts.length - 1].replace(/_/g, ' ')
  return parts.length > 1 ? `${city} (${parts[0]})` : city
}
