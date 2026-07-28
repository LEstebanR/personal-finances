'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'

export function SelectField({
  name,
  label,
  placeholder,
  children,
  itemClassName,
  onValueChange,
}: {
  name: string
  label?: string
  placeholder?: string
  children: ReactNode
  itemClassName?: string
  onValueChange?: (value: string) => void
}) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Select
              name={name}
              value={field.value || undefined}
              onValueChange={(value) => {
                field.onChange(value)
                onValueChange?.(value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>{children}</SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
