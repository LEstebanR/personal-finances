'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { ComponentProps } from 'react'
import { useFormContext } from 'react-hook-form'

export function TextField({
  name,
  label,
  itemClassName,
  ...props
}: {
  name: string
  label?: string
  itemClassName?: string
} & Omit<ComponentProps<typeof Input>, 'name'>) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input {...field} {...props} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
