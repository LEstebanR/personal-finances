import { cn } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Wallet className="text-primary h-8 w-8" />
      <span className="flex items-center text-2xl font-bold">
        <span className="text-primary">LES</span>
        <span className="italic">Fin</span>
      </span>
    </div>
  )
}
