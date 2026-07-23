import { Loader } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader size="lg" />
    </div>
  )
}
