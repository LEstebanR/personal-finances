'use client'

import {
  cancelSubscription,
  deleteSubscription,
  reactivateSubscription,
} from '@/app/dashboard/subscriptions/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useSubscriptions } from '@/lib/queries'
import { Loader, PlusIcon, Repeat, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  AddSubscriptionDialog,
  EditableSubscription,
} from './add-subscription-dialog'
import { useDashboardRefresh } from './refresh-provider'

interface Subscription {
  id: string
  name: string
  categoryId: string
  subcategoryId: string | null
  categoryName: string
  subcategoryName: string | null
  amount: number
  dueDay: number
  startDate: Date
  isActive: boolean
}

export function Subscriptions() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const { data: subscriptions = [], isLoading: loading } = useSubscriptions()
  const [editingSubscription, setEditingSubscription] =
    useState<EditableSubscription | null>(null)

  const totalMonthly = subscriptions
    .filter((s) => s.isActive)
    .reduce((total, s) => total + s.amount, 0)

  const handleCancel = async (id: string) => {
    try {
      await cancelSubscription(id)
      toast.success(t('subscriptions.cancelSuccess'))
      triggerRefresh()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(t('subscriptions.cancelFailed'))
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await reactivateSubscription(id)
      toast.success(t('subscriptions.reactivateSuccess'))
      triggerRefresh()
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast.error(t('subscriptions.reactivateFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscription(id)
      toast.success(t('subscriptions.deleteSuccess'))
      triggerRefresh()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error(t('subscriptions.deleteFailed'))
    }
  }

  const SubscriptionCard = ({
    subscription,
  }: {
    subscription: Subscription
  }) => (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${!subscription.isActive ? 'opacity-60' : ''}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="truncate text-xl font-bold text-gray-900">
            {subscription.name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="secondary">{subscription.categoryName}</Badge>
            {subscription.subcategoryName && (
              <Badge variant="secondary">{subscription.subcategoryName}</Badge>
            )}
            <Badge variant={subscription.isActive ? 'default' : 'outline'}>
              {subscription.isActive
                ? t('subscriptions.active')
                : t('subscriptions.cancelled')}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setEditingSubscription({
              id: subscription.id,
              name: subscription.name,
              categoryId: subscription.categoryId,
              subcategoryId: subscription.subcategoryId,
              amount: subscription.amount,
              dueDay: subscription.dueDay,
              startDate: subscription.startDate,
            })
          }
        >
          {t('debts.edit')}
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          ${formatMoney(subscription.amount, currency)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {t('debts.dueOnDay', { day: String(subscription.dueDay) })}
        </p>
      </div>

      <div className="flex gap-2">
        {subscription.isActive ? (
          <Button
            className="flex-1"
            size="sm"
            variant="outline"
            onClick={() => handleCancel(subscription.id)}
          >
            {t('subscriptions.cancelSubscription')}
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="sm"
            variant="outline"
            onClick={() => handleReactivate(subscription.id)}
          >
            {t('subscriptions.reactivateSubscription')}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('subscriptions.deleteConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('subscriptions.deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('debts.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(subscription.id)}>
                {t('debts.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('subscriptions.title')}</h1>
          {!loading && subscriptions.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {t('subscriptions.totalMonthly')}: $
              {formatMoney(totalMonthly, currency)}
            </p>
          )}
        </div>
        <AddSubscriptionDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {t('subscriptions.addSubscription')}
            </Button>
          }
        />
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <Loader className="m-auto h-8 w-8 animate-spin" />
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Repeat className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('subscriptions.noSubscriptionsYet')}
            </h3>
            <p className="mb-6 max-w-sm text-gray-500">
              {t('subscriptions.noSubscriptionsYetDesc')}
            </p>
            <AddSubscriptionDialog
              trigger={
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {t('subscriptions.addSubscription')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        )}
      </div>

      <AddSubscriptionDialog
        subscription={editingSubscription}
        open={!!editingSubscription}
        onOpenChange={(open) => !open && setEditingSubscription(null)}
      />
    </div>
  )
}
