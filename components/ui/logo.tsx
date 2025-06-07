import { Wallet } from 'lucide-react'
import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
      <Wallet className="h-10 w-10" />
      <span>Personal Finance</span>
    </Link>
  )
}
