'use client'

import {
  createCategory,
  getCategories,
} from '@/app/dashboard/categories/actions'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

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

interface Category {
  id: string
  name: string
}

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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [value, setValue] = useState(defaultValue ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories(type)
      .then(setCategories)
      .catch((error) => console.error('Error loading categories:', error))
  }, [type])

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
      setCategories((prev) =>
        prev.some((c) => c.id === category.id)
          ? prev
          : [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
      )
      handleSelect(category.id)
    } catch (error) {
      console.error('Error creating category:', error)
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
                  <CommandItem onSelect={handleCreate} disabled={loading}>
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
