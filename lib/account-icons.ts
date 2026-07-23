import {
  Banknote,
  Briefcase,
  Building2,
  Coins,
  CreditCard,
  Gem,
  HandCoins,
  Home,
  Landmark,
  Lock,
  type LucideIcon,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'

export const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  lock: Lock,
  landmark: Landmark,
  'credit-card': CreditCard,
  banknote: Banknote,
  coins: Coins,
  'hand-coins': HandCoins,
  'building-2': Building2,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  home: Home,
  'shield-check': ShieldCheck,
  gem: Gem,
}

export function getAccountIcon(name: string | null | undefined) {
  return name ? ACCOUNT_ICONS[name] : undefined
}
