'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabaseClient } from '@/utils/supabase'
import { User } from '@supabase/supabase-js'
import { Loader, PiggyBank, PlusIcon, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'

interface Account {
  id: string
  userId: string
  name: string
  type: string
  initialBalance: number | string
  description: string | null
  createdAt: string
  isArchived: boolean
}

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  // Función para cargar accounts
  const loadAccounts = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: accounts, error } = await supabase
      .from('Account')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading accounts:', error)
    } else {
      setAccounts(accounts || [])
    }
  }

  // Obtener usuario y accounts al montar el componente
  useEffect(() => {
    const loadUserAndAccounts = async () => {
      const supabase = supabaseClient()

      // Obtener usuario
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await loadAccounts(user)
      }

      setLoading(false)
    }

    loadUserAndAccounts()
  }, [])

  // Filtrar accounts por tipo
  const filterAccountsByType = (type: 'all' | 'cash' | 'savings') => {
    if (type === 'all') return accounts
    return accounts.filter((account) => account.type === type)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const supabase = supabaseClient()

    if (!user) {
      console.error('User not authenticated')
      return
    }

    const accountData = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: formData.get('accountName') as string,
      type: formData.get('accountType') as string,
      initialBalance: parseFloat(formData.get('initialBalance') as string),
      description: formData.get('description') as string,
    }

    console.log('Account Data to insert:', accountData)

    const { data, error } = await supabase
      .from('Account')
      .insert([accountData])
      .select()

    if (error) {
      console.error('Insert error:', error)
    } else {
      console.log('Account created successfully:', data)
      // Recargar accounts después de crear
      if (user) {
        await loadAccounts(user)
      }
      // Reset form
      e.currentTarget?.reset()
    }
  }

  // Componente para renderizar una account card
  const AccountCard = ({ account }: { account: Account }) => {
    const Icon = account.type === 'cash' ? Wallet : PiggyBank

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Icon className="text-primary h-5 w-5" />
            </div>
            <span className="text-primary bg-primary/10 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
              {account.type}
            </span>
          </div>
        </div>

        <h3 className="mb-2 truncate text-xl font-bold text-gray-900">
          {account.name}
        </h3>

        {/* Balance */}
        <div className="mb-4">
          <p className="mb-1 text-sm text-gray-500">Current Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            $
            {Number(account.initialBalance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    )
  }

  // Componente EmptyState para categorías sin accounts
  const EmptyState = ({ type }: { type: 'cash' | 'savings' }) => {
    const Icon = type === 'cash' ? Wallet : PiggyBank
    const typeLabel = type === 'cash' ? 'Cash' : 'Savings'

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          No {typeLabel} Accounts Yet
        </h3>
        <p className="mb-6 max-w-sm text-gray-500">
          You haven&apos;t created any {typeLabel.toLowerCase()} accounts yet.
          Create your first {typeLabel.toLowerCase()} account to start tracking
          your money.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create {typeLabel} Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Create a new financial account to track your money.
            </DialogDescription>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <Label>Account Name</Label>
                <Input
                  type="text"
                  name="accountName"
                  placeholder="Account Name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Account Type</Label>
                <Select name="accountType" required defaultValue={type}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  name="initialBalance"
                  placeholder="Initial Balance"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="resize-none"
                />
              </div>
              <Button className="w-full" type="submit">
                Add Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Create a new financial account to track your money.
            </DialogDescription>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <Label>Account Name</Label>
                <Input
                  type="text"
                  name="accountName"
                  placeholder="Account Name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Account Type</Label>
                <Select name="accountType" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  name="initialBalance"
                  placeholder="Initial Balance"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="resize-none"
                />
              </div>
              <Button className="w-full" type="submit">
                Add Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de accounts con tabs */}
      <div className="mt-6 w-full">
        {loading ? (
          <Loader />
        ) : accounts.length === 0 ? (
          <p className="text-center text-gray-500">
            No accounts found. Create your first account!
          </p>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({accounts.length})</TabsTrigger>
              <TabsTrigger value="cash">
                Cash ({filterAccountsByType('cash').length})
              </TabsTrigger>
              <TabsTrigger value="savings">
                Savings ({filterAccountsByType('savings').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filterAccountsByType('all').map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cash" className="mt-6">
              {filterAccountsByType('cash').length === 0 ? (
                <EmptyState type="cash" />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filterAccountsByType('cash').map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="savings" className="mt-6">
              {filterAccountsByType('savings').length === 0 ? (
                <EmptyState type="savings" />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filterAccountsByType('savings').map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
