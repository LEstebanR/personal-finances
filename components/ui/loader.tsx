import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  default: 'h-8 w-8 border-[3px]',
  lg: 'h-10 w-10 border-[3px]',
} as const

export function Loader({
  size = 'default',
  className,
}: {
  size?: keyof typeof sizeClasses
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'border-muted border-t-primary animate-spin rounded-full',
        sizeClasses[size],
        className
      )}
    />
  )
}
