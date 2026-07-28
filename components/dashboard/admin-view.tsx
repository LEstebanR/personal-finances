'use client'

import { setUserPlanAdmin } from '@/app/dashboard/admin/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader } from '@/components/ui/loader'
import { useAdminFeedback, useAdminStats, useAdminUsers } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MessageSquareHeart,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { toast } from 'sonner'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { Input } from '../ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <Card>
      <CardHeader className="flex min-h-10 flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}

function MetricsTab() {
  const { t } = useLanguage()
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading || !stats) return <Loader className="m-auto" />

  const distribution = [
    { name: t('admin.free'), value: stats.freeUsers, fill: 'var(--chart-2)' },
    { name: t('admin.pro'), value: stats.proUsers, fill: 'var(--chart-1)' },
  ].filter((entry) => entry.value > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t('admin.totalUsers')}
          value={stats.totalUsers}
        />
        <StatCard
          icon={UserPlus}
          label={t('admin.newUsers30d')}
          value={stats.newUsers30d}
        />
        <StatCard
          icon={CreditCard}
          label={t('admin.totalAccounts')}
          value={stats.totalAccounts}
        />
        <StatCard
          icon={CreditCard}
          label={t('admin.totalTransactions')}
          value={stats.totalTransactions}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.planDistribution')}</CardTitle>
          <CardDescription>{t('admin.planDistributionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-56 w-full sm:w-1/2"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                />
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={2}
                >
                  {distribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="w-full space-y-2 sm:w-1/2">
              {distribution.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    {entry.name}
                  </div>
                  <span className="text-muted-foreground">
                    {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsersTab() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useAdminUsers(page, search)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleTogglePlan = async (userId: string, currentPlan: string) => {
    setUpdatingId(userId)
    try {
      await setUserPlanAdmin(userId, currentPlan === 'PRO' ? 'FREE' : 'PRO')
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(t('admin.planUpdated'))
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error(t('admin.planUpdateFailed'))
    }
    setUpdatingId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder={t('admin.searchUsers')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        className="max-w-sm"
      />

      {isLoading || !data ? (
        <Loader className="m-auto" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.name')}</TableHead>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.plan')}</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead>{t('admin.accounts')}</TableHead>
                  <TableHead className="text-right">
                    {t('admin.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.plan === 'PRO' ? 'default' : 'secondary'}
                      >
                        {user.plan === 'PRO' ? t('admin.pro') : t('admin.free')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user._count.accounts}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === user.id}
                        onClick={() => handleTogglePlan(user.id, user.plan)}
                      >
                        {user.plan === 'PRO'
                          ? t('admin.moveToFree')
                          : t('admin.moveToPro')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {t('admin.pageOf', {
                page: data.page,
                totalPages: data.totalPages,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FeedbackTab() {
  const { t } = useLanguage()
  const { data: feedback, isLoading } = useAdminFeedback()

  if (isLoading || !feedback) return <Loader className="m-auto" />

  if (feedback.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquareHeart className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-muted-foreground">{t('admin.noFeedback')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {feedback.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{item.name || item.user.name}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <p className="text-muted-foreground mb-2 text-xs">
              {item.user.email}
            </p>
            <p className="text-sm whitespace-pre-wrap">{item.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AdminView() {
  const { t } = useLanguage()

  return (
    <div className="flex w-full flex-col gap-4 rounded-md p-4 md:mt-4 md:w-11/12 md:p-8">
      <h1 className="text-2xl font-bold">{t('nav.admin')}</h1>
      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">{t('admin.metrics')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
          <TabsTrigger value="feedback">{t('admin.feedback')}</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <MetricsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
