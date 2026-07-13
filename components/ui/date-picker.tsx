'use client'

import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export function DatePicker({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: Date
}) {
  const { language } = useLanguage()
  const [date, setDate] = useState<Date | undefined>(defaultValue ?? new Date())
  const [open, setOpen] = useState(false)
  const locale = language === 'es' ? es : undefined

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, 'PPP', { locale }) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              setDate(selected)
              setOpen(false)
            }}
            locale={locale}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, 'yyyy-MM-dd') : ''}
      />
    </div>
  )
}
