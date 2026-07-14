'use client'

import { createCategory } from '@/app/dashboard/categories/actions'
import { useLanguage } from '@/components/language-provider'
import { useCategories } from '@/lib/queries'
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

export function CategoryCombobox({
  name,
  type,
  defaultValue,
  onChange,
}: {
  name: string
  type: 'income' | 'expense'
  defaultValue?: string
  onChange?: (categoryId: string) => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: categories = [], error } = useCategories(type)
  const [value, setValue] = useState(defaultValue ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!error) return
    console.error('Error loading categories:', error)
    toast.error(t('transactions.loadCategoriesFailed'))
  }, [error, t])

  const selectedCategory = categories.find((c) => c.id === value)
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === search.trim().toLowerCase()
  )

  const handleSelect = (categoryId: string) => {
    setValue(categoryId)
    onChange?.(categoryId)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const category = await createCategory(search.trim(), type)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      handleSelect(category.id)
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error(t('transactions.createCategoryFailed'))
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
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedCategory
                ? selectedCategory.name
                : t('transactions.selectCategory')}
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
              placeholder={t('transactions.searchOrCreateCategory')}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 && !search && (
                <CommandEmpty>
                  {t('transactions.noCategoriesFound')}
                </CommandEmpty>
              )}
              <CommandGroup>
                {filtered.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => handleSelect(category.id)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === category.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {category.name}
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
                    {t('transactions.createCategory', { name: search.trim() })}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} required />
    </div>
  )
}
