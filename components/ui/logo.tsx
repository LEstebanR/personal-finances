import { cn } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-2 text-2xl font-bold', className)}
    >
      <Wallet className="h-10 w-10" />
      <span>Personal Finance</span>
    </div>
  )
}
