import { Github, Heart } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="my-8 w-full">
      <div className="z-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-3 sm:gap-x-2">
        <Link
          href="https://github.com/LEstebanR/lesteban"
          aria-label="Github project"
        >
          <Github className="h-6 w-6" />
        </Link>
        <div className="bg-primary mx-2 h-[30px] w-[0.5px] rotate-[20deg]"></div>
        <div className="flex items-center gap-x-1 text-xs sm:text-base">
          <span className="text-slate-500">Made with</span>
          <Heart className="h-4 w-4 text-red-500" />
          <span className="text-slate-500">by</span>
          <Link href="https://github.com/LEstebanR/lesteban">LEstebanR</Link>
        </div>
      </div>
    </footer>
  )
}
