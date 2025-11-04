import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaymentsService } from '@/lib/payments-service'
import type { Subscription, AuditLogEntry, RevenueMetrics } from '@/lib/payments-types'
import { MagnifyingGlass, CurrencyDollar, Users, TrendUp, Gift, X, ArrowCounterClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function SubscriptionAdminPanel() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [compDialogOpen, setCompDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [compMonths, setCompMonths] = useState('1')
  const [compReason, setCompReason] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [subs, logs, rev] = await Promise.all([
        PaymentsService.getAllSubscriptions(),
        PaymentsService.getAuditLogs(100),
        PaymentsService.getRevenueMetrics(),
      ])
      setSubscriptions(subs)
      setAuditLogs(logs)
      setMetrics(rev)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCompSubscription = async () => {
    if (!selectedSubscription || !compReason.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const user = await spark.user()
      await PaymentsService.compSubscription(
        selectedSubscription.userId,
        selectedSubscription.planId,
        parseInt(compMonths),
        user.id,
        compReason
      )

      toast.success('Subscription comped successfully')
      setCompDialogOpen(false)
      setCompReason('')
      setCompMonths('1')
      setSelectedSubscription(null)
      await loadData()
    } catch {
      toast.error('Failed to comp subscription')
    }
  }

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return
    }

    try {
      const user = await spark.user()
      await PaymentsService.cancelSubscription(
        subscription.id,
        true,
        user.id,
        'Admin cancellation'
      )

      toast.success('Subscription canceled')
      await loadData()
    } catch {
      toast.error('Failed to cancel subscription')
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub =>
    String(sub.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(sub.planId || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      canceled: 'destructive',
      expired: 'outline',
      past_due: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics ? formatCurrency(metrics.mrr) : '$0'}</div>
            <p className="text-xs text-muted-foreground">ARR: {metrics ? formatCurrency(metrics.arr) : '$0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.newSubscriptionsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics ? formatCurrency(metrics.arpu) : '$0'}</div>
            <p className="text-xs text-muted-foreground">Per active subscriber</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <ArrowCounterClockwise className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics ? metrics.churnRate.toFixed(1) : '0'}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.canceledSubscriptionsThisMonth || 0} canceled this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>View and manage user subscriptions</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user ID or plan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={loadData} variant="outline">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-mono text-xs">
                        {String(subscription.userId || 'unknown').slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {subscription.planId}
                        {subscription.isComp && (
                          <Badge variant="secondary" className="ml-2">
                            <Gift className="h-3 w-3 mr-1" />
                            Comp
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="capitalize">{subscription.store}</TableCell>
                      <TableCell>{formatDate(subscription.currentPeriodEnd)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setCompDialogOpen(true)
                            }}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelSubscription(subscription)}
                            disabled={subscription.status === 'canceled'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No subscriptions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Recent administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(log.actorUserId || 'unknown').slice(0, 12)}...
                        <Badge variant="outline" className="ml-2 text-xs">
                          {log.actorRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{String(log.action || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.targetUserId ? `${String(log.targetUserId).slice(0, 12)}...` : '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {log.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {auditLogs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No audit logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={compDialogOpen} onOpenChange={setCompDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comp Subscription</DialogTitle>
            <DialogDescription>
              Grant a complimentary subscription to this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={selectedSubscription?.userId || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Duration (months)</Label>
              <Select value={compMonths} onValueChange={setCompMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea
                placeholder="Why is this subscription being comped?"
                value={compReason}
                onChange={(e) => setCompReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompSubscription}>
              Comp Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
