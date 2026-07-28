'use client'

import { CurrencyInput } from '@/components/ui/currency-input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useFormContext } from 'react-hook-form'

export function CurrencyField({
  name,
  label,
  defaultValue,
  itemClassName,
}: {
  name: string
  label?: string
  defaultValue?: string
  itemClassName?: string
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
            <CurrencyInput
              name={name}
              defaultValue={defaultValue}
              onValueChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
