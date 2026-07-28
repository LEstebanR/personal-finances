'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { ComponentProps } from 'react'
import { useFormContext } from 'react-hook-form'

export function TextareaField({
  name,
  label,
  itemClassName,
  ...props
}: {
  name: string
  label?: string
  itemClassName?: string
} & Omit<ComponentProps<typeof Textarea>, 'name'>) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea {...field} {...props} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
