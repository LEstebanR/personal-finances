'use client'

import { findOrCreateSubcategory } from '@/app/dashboard/categories/actions'
import { useLanguage } from '@/components/language-provider'
import { useSubcategories } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

export function SubcategoryCombobox({
  name,
  categoryId,
  defaultValue,
}: {
  name: string
  categoryId: string
  defaultValue?: string
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: subcategories = [], error } = useSubcategories(categoryId)
  const [value, setValue] = useState(defaultValue ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!error) return
    console.error('Error loading subcategories:', error)
    toast.error(t('transactions.loadSubcategoriesFailed'))
  }, [error, t])

  const selected = subcategories.find((s) => s.id === value)
  const filtered = subcategories.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const exactMatch = subcategories.some(
    (s) => s.name.toLowerCase() === search.trim().toLowerCase()
  )

  const handleSelect = (id: string) => {
    setValue(id)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const subcategory = await findOrCreateSubcategory(
        categoryId,
        search.trim()
      )
      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      })
      handleSelect(subcategory.id)
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast.error(t('transactions.createSubcategoryFailed'))
    }
    setLoading(false)
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={!categoryId}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected ? selected.name : t('transactions.selectSubcategory')}
            </span>
            <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('transactions.searchOrCreateSubcategory')}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 && !search && (
                <CommandEmpty>
                  {t('transactions.noSubcategoriesFound')}
                </CommandEmpty>
              )}
              <CommandGroup>
                {filtered.map((subcategory) => (
                  <CommandItem
                    key={subcategory.id}
                    value={subcategory.id}
                    onSelect={() => handleSelect(subcategory.id)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === subcategory.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {subcategory.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !exactMatch && (
                <CommandGroup>
                  <CommandItem
                    value={`__create__${search.trim()}`}
                    onSelect={handleCreate}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    {t('transactions.createSubcategory', {
                      name: search.trim(),
                    })}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
