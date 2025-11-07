/**
 * Chat Moderation Panel
 * 
 * Admin panel for reviewing reported messages and taking moderation actions.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MessageReport } from '@/lib/chat-types'
import { createLogger } from '@/lib/logger'
import type { User } from '@/lib/user-service'
import { Check, Eye, Flag, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { isTruthy } from '@petspark/shared'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useStorage } from '@/hooks/useStorage'
import { adminAPI } from '@/lib/api-services'

const logger = createLogger('ChatModerationPanel')

export default function ChatModerationPanel() {
  const [reports, setReports] = useState<MessageReport[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null)
  const [action, setAction] = useState<'warning' | 'mute' | 'suspend' | 'no_action'>('no_action')
  const [currentUser] = useStorage<User | null>('current-user', null)

  useEffect(() => {
    void loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getChatReports()
      const allReports = response.items ?? []
      setReports(allReports.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      logger.error('Load reports error', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedReport || !currentUser) return

    try {
      const response = await adminAPI.reviewChatReport(selectedReport.id, {
        action,
        reviewerId: currentUser.id || 'admin',
      })

      const updatedReport = response.report
      setReports(prev => prev.map(r => (r.id === updatedReport.id ? updatedReport : r)))

      toast.success(`Action taken: ${String(action ?? '')}`)
      setSelectedReport(null)
      setAction('no_action')
      void loadReports()
    } catch (error) {
      logger.error('Review error', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to review report')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>
      case 'reviewed':
        return <Badge variant="secondary">Reviewed</Badge>
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>
      default:
        return <Badge variant="outline">Dismissed</Badge>
    }
  }

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>
      case 'harassment':
        return <Badge variant="destructive">Harassment</Badge>
      case 'inappropriate':
        return <Badge variant="destructive">Inappropriate</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  const pendingReports = reports.filter(r => r.status === 'pending')
  const reviewedReports = reports.filter(r => r.status === 'reviewed' || r.status === 'resolved')

  if (isTruthy(loading)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat Moderation</h2>
          <p className="text-muted-foreground">Review reported messages and take action</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {pendingReports.length} pending reports
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Flag size={16} className="mr-2" />
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            <Check size={16} className="mr-2" />
            Reviewed ({reviewedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending reports</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingReports.map((report) => (
                <Card
                  key={report.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => { setSelectedReport(report); }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(report.status)}
                        {getReasonBadge(report.reason)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Reported by: {report.reportedBy}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason: {report.reason}
                      </p>
                      {report.description && (
                        <p className="text-sm mt-2">{report.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedReport(report)
                      }}
                    >
                      <Eye size={16} className="mr-2" />
                      Review
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedReports.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No reviewed reports</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviewedReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(report.status)}
                        {getReasonBadge(report.reason)}
                        {report.action && (
                          <Badge variant="outline">{report.action}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reviewed by: {report.reviewedBy} on {report.reviewedAt && new Date(report.reviewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          action={action}
          setAction={setAction}
          onClose={() => { setSelectedReport(null); }}
          onReview={() => { void handleReview() }}
        />
      )}
    </div>
  )
}

// Report detail modal component
function ReportDetailModal({ 
  report, 
  action,
  setAction,
  onClose,
  onReview
}: { 
  report: MessageReport
  action: 'warning' | 'mute' | 'suspend' | 'no_action'
  setAction: (action: 'warning' | 'mute' | 'suspend' | 'no_action') => void
  onClose: () => void
  onReview: () => void
}) {
  const entry = useEntryAnimation({ initialY: 20, initialOpacity: 0 })
  
  return (
    <AnimatedView
      style={entry.animatedStyle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Report Details</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Report Reason</Label>
            <p className="text-sm">{report.reason}</p>
          </div>

          {report.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm">{report.description}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">Action</Label>
            <Select value={action} onValueChange={(v) => { setAction(v as typeof action); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_action">No Action</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="mute">Mute User</SelectItem>
                <SelectItem value="suspend">Suspend User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onReview}>
              <Check size={16} className="mr-2" />
              Take Action
            </Button>
          </div>
        </div>
      </Card>
    </AnimatedView>
  )
}

