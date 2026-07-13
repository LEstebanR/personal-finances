'use client'

import { formatTimezoneLabel, groupTimezonesByRegion } from '@/lib/timezones'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const timezoneGroups = groupTimezonesByRegion()

export function TimezoneCombobox({
  name,
  defaultValue,
  placeholder = 'Select timezone...',
}: {
  name: string
  defaultValue: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {value ? formatTimezoneLabel(value) : placeholder}
            </span>
            <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command
            filter={(itemValue, search) => {
              const label = formatTimezoneLabel(itemValue).toLowerCase()
              return label.includes(search.toLowerCase()) ? 1 : 0
            }}
          >
            <CommandInput placeholder="Search city or region..." />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              {Object.entries(timezoneGroups).map(([region, zones]) => (
                <CommandGroup key={region} heading={region}>
                  {zones.map((timezone) => (
                    <CommandItem
                      key={timezone}
                      value={timezone}
                      onSelect={(selected) => {
                        setValue(selected)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === timezone ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {formatTimezoneLabel(timezone)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
