import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date-only fields (no meaningful time-of-day) are stored as UTC midnight.
// Reading them back with local Date getters can shift the displayed day by
// one for negative UTC-offset timezones. Re-anchor to local midnight so
// components that read local getters (react-day-picker, date-fns `format`)
// show the intended calendar day.
export function toLocalMidnight(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}
