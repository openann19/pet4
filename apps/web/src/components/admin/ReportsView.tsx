import { adminApi } from '@/api/admin-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useStorage } from '@/hooks/useStorage'
import { generateULID } from '@/lib/utils'
import type { Icon } from '@phosphor-icons/react'
import { CheckCircle, Clock, Eye, Flag, Warning, XCircle } from '@phosphor-icons/react'
import { Presence, motion } from '@petspark/motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Report {
  id: string
  reportedBy: string
  reportedUserId?: string
  reportedPetId?: string
  reportedContent?: string
  reason: string
  description: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  resolution?: string
  action?: string
}

export default function ReportsView() {
  const [reports, setReports] = useStorage<Report[]>('admin-reports', [])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [actionType, setActionType] = useState<string>('dismiss')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>('all')

  useEffect(() => {
    if (!reports || reports.length === 0) {
      const sampleReports: Report[] = [
        {
          id: generateULID(),
          reportedBy: 'User #1234',
          reportedPetId: 'pet-001',
          reason: 'Inappropriate content',
          description: 'Pet profile contains inappropriate images',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString()
        },
        {
          id: generateULID(),
          reportedBy: 'User #5678',
          reportedUserId: 'user-002',
          reason: 'Harassment',
          description: 'User sending harassing messages',
          status: 'reviewing',
          priority: 'critical',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: generateULID(),
          reportedBy: 'User #9012',
          reportedPetId: 'pet-003',
          reason: 'Fake profile',
          description: 'Suspected fake pet profile using stock photos',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ]
      setReports(sampleReports)
    }
  }, [])

  const handleReview = (report: Report) => {
    setSelectedReport(report)
    setDialogOpen(true)
    setResolution('')
    setActionType('dismiss')
  }

  const handleResolve = async () => {
    if (!selectedReport || !resolution.trim()) {
      toast.error('Please provide resolution details')
      return
    }

    const updatedReports = (reports || []).map(r =>
      r.id === selectedReport.id
        ? {
            ...r,
            status: 'resolved' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Current Admin',
            resolution,
            action: actionType
          }
        : r
    )

    setReports(updatedReports)
    setDialogOpen(false)
    toast.success('Report resolved successfully')

    const auditEntry = {
      adminId: 'admin-current',
      action: 'resolve_report',
      targetType: 'report',
      targetId: selectedReport.id,
      details: JSON.stringify({
        reportReason: selectedReport.reason,
        resolution,
        actionType
      })
    }

    await adminApi.createAuditLog(auditEntry)
  }

  const handleDismiss = async () => {
    if (!selectedReport) return

    const updatedReports = (reports || []).map(r =>
      r.id === selectedReport.id
        ? {
            ...r,
            status: 'dismissed' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Current Admin',
            resolution: 'Dismissed - no violation found'
          }
        : r
    )

    setReports(updatedReports)
    setDialogOpen(false)
    toast.success('Report dismissed')
  }

  const filteredReports = (reports || []).filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  const pendingCount = (reports || []).filter(r => r.status === 'pending').length
  const reviewingCount = (reports || []).filter(r => r.status === 'reviewing').length
  const resolvedCount = (reports || []).filter(r => r.status === 'resolved').length

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Review and moderate reported content
            </p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs value={filterStatus} onValueChange={(v: string) => setFilterStatus(v as 'all' | 'pending' | 'reviewing' | 'resolved')}>
            <TabsList>
              <TabsTrigger value="all">
                All ({(reports || []).length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="reviewing">
                Reviewing ({reviewingCount})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <Presence mode="popLayout">
              {filteredReports.map((report, index) => (
                <MotionView
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{report.reason}</CardTitle>
                            <PriorityBadge priority={report.priority} />
                            <StatusBadge status={report.status} />
                          </div>
                          <CardDescription>
                            Reported by {report.reportedBy} • {new Date(report.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleReview(report)}
                          disabled={report.status === 'resolved' || report.status === 'dismissed'}
                        >
                          <Eye size={16} className="mr-2" />
                          Review
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      {report.reportedPetId && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Pet ID: {report.reportedPetId}
                        </p>
                      )}
                      {report.reportedUserId && (
                        <p className="text-xs text-muted-foreground mt-2">
                          User ID: {report.reportedUserId}
                        </p>
                      )}
                      {report.resolution && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Resolution:</p>
                          <p className="text-sm text-muted-foreground mt-1">{report.resolution}</p>
                          {report.reviewedBy && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Reviewed by {report.reviewedBy} • {new Date(report.reviewedAt!).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </MotionView>
              ))}
            </Presence>

            {filteredReports.length === 0 && (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <CheckCircle size={48} className="mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No reports found</h3>
                  <p className="text-sm text-muted-foreground">
                    {filterStatus === 'pending' ? 'All pending reports have been reviewed' : 'No reports in this category'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review the reported content and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Reason:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Description:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Action to take:</p>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dismiss">Dismiss (no violation)</SelectItem>
                    <SelectItem value="warning">Send warning</SelectItem>
                    <SelectItem value="remove_content">Remove content</SelectItem>
                    <SelectItem value="suspend_user">Suspend user (7 days)</SelectItem>
                    <SelectItem value="ban_user">Ban user permanently</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Resolution notes:</p>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain the action taken and reasoning..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleDismiss}>
              <XCircle size={16} className="mr-2" />
              Dismiss
            </Button>
            <Button onClick={handleResolve}>
              <CheckCircle size={16} className="mr-2" />
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
  const variants: Record<string, { variant: BadgeVariant; icon: Icon }> = {
    low: { variant: 'secondary', icon: Clock },
    medium: { variant: 'default', icon: Flag },
    high: { variant: 'default', icon: Warning },
    critical: { variant: 'destructive', icon: Warning }
  }

  const config = variants[priority] ?? variants['medium']
  if (!config) return null
  const Icon = config.icon

  return (
    <Badge variant={config?.variant} className="gap-1">
      <Icon size={12} weight="fill" />
      {priority}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
  const variants: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    reviewing: { variant: 'default', label: 'Reviewing' },
    resolved: { variant: 'default', label: 'Resolved' },
    dismissed: { variant: 'outline', label: 'Dismissed' }
  }

  const config = variants[status] ?? variants['pending']
  if (!config) return null

  return (
    <Badge variant={config?.variant}>
      {config?.label}
    </Badge>
  )
}
