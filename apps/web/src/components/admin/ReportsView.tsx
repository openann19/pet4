import { adminApi } from '@/api/admin-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { adminReportsApi } from '@/lib/api/admin';
import type { Report } from '@/lib/contracts';
import { createLogger } from '@/lib/logger';
import type { Icon } from '@phosphor-icons/react';
import { CheckCircle, Clock, Eye, Flag, Warning, XCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('ReportsView');

/**
 * UI Report interface - maps backend Report to UI needs
 */
interface UIReport {
  id: string;
  reportedBy: string;
  reportedUserId?: string;
  reportedPetId?: string;
  reportedContent?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
  action?: string;
}

/**
 * Map backend Report to UI Report format
 */
function mapBackendReportToUI(backendReport: Report): UIReport {
  // Determine priority based on reason and status
  const getPriority = (reason: string, status: string): UIReport['priority'] => {
    if (status === 'resolved' || status === 'dismissed') {
      return 'low';
    }
    if (reason === 'harassment' || reason === 'violence') {
      return 'critical';
    }
    if (reason === 'inappropriate' || reason === 'fake') {
      return 'high';
    }
    return 'medium';
  };

  // Map status: 'investigating' -> 'reviewing'
  const uiStatus: UIReport['status'] =
    backendReport.status === 'investigating'
      ? 'reviewing'
      : (backendReport.status as UIReport['status']);

  const uiReport: UIReport = {
    id: backendReport.id,
    reportedBy: backendReport.reporterId,
    reason: backendReport.reason,
    description: backendReport.details,
    status: uiStatus,
    priority: getPriority(backendReport.reason, backendReport.status),
    createdAt: backendReport.createdAt,
  };

  // Extract entity type info
  if (backendReport.reportedEntityType === 'user') {
    uiReport.reportedUserId = backendReport.reportedEntityId;
  } else if (backendReport.reportedEntityType === 'pet') {
    uiReport.reportedPetId = backendReport.reportedEntityId;
  } else if (backendReport.reportedEntityType === 'message') {
    uiReport.reportedContent = backendReport.reportedEntityId;
  }

  // Map resolution info
  if (backendReport.resolution) {
    uiReport.action = backendReport.resolution.action;
    uiReport.resolution = backendReport.resolution.notes;
    uiReport.reviewedBy = backendReport.resolution.resolvedBy;
  }

  if (backendReport.resolvedAt) {
    uiReport.reviewedAt = backendReport.resolvedAt;
  }

  return uiReport;
}

export default function ReportsView() {
  const [reports, setReports] = useState<UIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<UIReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [actionType, setActionType] = useState<string>('dismiss');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>(
    'all'
  );
  const [actionInFlight, setActionInFlight] = useState(false);

  useEffect(() => {
    void loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const backendReports = await adminReportsApi.listReports();
      const uiReports = backendReports.map(mapBackendReportToUI);
      setReports(uiReports);
    } catch (error) {
      logger.error(
        'Failed to load reports',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (report: UIReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
    setResolution('');
    setActionType('dismiss');
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    if (actionType === 'dismiss') {
      await handleDismiss();
      return;
    }

    if (!resolution.trim()) {
      toast.error('Please provide resolution details');
      return;
    }

    setActionInFlight(true);
    try {
      // Map UI action to backend action
      const backendAction =
        actionType === 'warning'
          ? 'warn'
          : actionType === 'remove_content'
            ? 'remove_content'
            : actionType === 'suspend_user'
              ? 'suspend'
              : actionType === 'ban_user'
                ? 'ban'
                : 'no_action';

      const updatedBackendReport = await adminReportsApi.resolveReport(selectedReport.id, {
        action: backendAction,
        notes: resolution,
      });

      const updatedUIReport = mapBackendReportToUI(updatedBackendReport);
      setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? updatedUIReport : r)));
      setDialogOpen(false);
      setResolution('');
      setActionType('dismiss');
      toast.success('Report resolved successfully');

      // Log audit entry
      try {
        const auditEntry = {
          adminId: updatedBackendReport.resolution?.resolvedBy ?? 'unknown',
          action: 'resolve_report',
          targetType: 'report',
          targetId: selectedReport.id,
          details: JSON.stringify({
            reportReason: selectedReport.reason,
            resolution,
            actionType: backendAction,
          }),
        };
        await adminApi.createAuditLog(auditEntry);
      } catch (auditError) {
        logger.error(
          'Failed to create audit log',
          auditError instanceof Error ? auditError : new Error(String(auditError))
        );
        // Don't fail the resolve operation if audit log fails
      }
    } catch (error) {
      logger.error(
        'Failed to resolve report',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to resolve report. Please try again.');
    } finally {
      setActionInFlight(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedReport) return;

    setActionInFlight(true);
    try {
      const updatedBackendReport = await adminReportsApi.dismissReport(
        selectedReport.id,
        resolution.trim() || 'Dismissed - no violation found'
      );

      const updatedUIReport = mapBackendReportToUI(updatedBackendReport);
      setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? updatedUIReport : r)));
      setDialogOpen(false);
      setResolution('');
      setActionType('dismiss');
      toast.success('Report dismissed');

      // Log audit entry
      try {
        const auditEntry = {
          adminId: updatedBackendReport.resolution?.resolvedBy ?? 'unknown',
          action: 'dismiss_report',
          targetType: 'report',
          targetId: selectedReport.id,
          details: JSON.stringify({
            reportReason: selectedReport.reason,
            resolution: resolution.trim() || 'Dismissed - no violation found',
          }),
        };
        await adminApi.createAuditLog(auditEntry);
      } catch (auditError) {
        logger.error(
          'Failed to create audit log',
          auditError instanceof Error ? auditError : new Error(String(auditError))
        );
        // Don't fail the dismiss operation if audit log fails
      }
    } catch (error) {
      logger.error(
        'Failed to dismiss report',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to dismiss report. Please try again.');
    } finally {
      setActionInFlight(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewingCount = reports.filter((r) => r.status === 'reviewing').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Review and moderate reported content</p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs
            value={filterStatus}
            onValueChange={(v: string) =>
              setFilterStatus(v as 'all' | 'pending' | 'reviewing' | 'resolved')
            }
          >
            <TabsList>
              <TabsTrigger value="all">All ({reports.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="reviewing">Reviewing ({reviewingCount})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            {filteredReports.map((report, index) => (
              <div
                key={report.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
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
                          Reported by {report.reportedBy} •{' '}
                          {new Date(report.createdAt).toLocaleString()}
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
                            Reviewed by {report.reviewedBy} •{' '}
                            {new Date(report.reviewedAt!).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <CheckCircle size={48} className="mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No reports found</h3>
                  <p className="text-sm text-muted-foreground">
                    {filterStatus === 'pending'
                      ? 'All pending reports have been reviewed'
                      : 'No reports in this category'}
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
                  onChange={(e) => { setResolution(e.target.value); }}
                  placeholder="Explain the action taken and reasoning..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setResolution('');
                setActionType('dismiss');
              }}
              disabled={actionInFlight}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void handleDismiss().catch((error) => {
                  logger.error(
                    'Failed to dismiss report',
                    error instanceof Error ? error : new Error(String(error))
                  );
                });
              }}
              disabled={actionInFlight}
            >
              <XCircle size={16} className="mr-2" />
              {actionInFlight ? 'Processing...' : 'Dismiss'}
            </Button>
            <Button
              onClick={() => {
                void handleResolve().catch((error) => {
                  logger.error(
                    'Failed to resolve report',
                    error instanceof Error ? error : new Error(String(error))
                  );
                });
              }}
              disabled={actionInFlight || actionType === 'dismiss'}
            >
              <CheckCircle size={16} className="mr-2" />
              {actionInFlight ? 'Processing...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
  const variants: Record<string, { variant: BadgeVariant; icon: Icon }> = {
    low: { variant: 'secondary', icon: Clock },
    medium: { variant: 'default', icon: Flag },
    high: { variant: 'default', icon: Warning },
    critical: { variant: 'destructive', icon: Warning },
  };

  const config = variants[priority] ?? variants.medium;
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge variant={config?.variant} className="gap-1">
      <Icon size={12} weight="fill" />
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
  const variants: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    reviewing: { variant: 'default', label: 'Reviewing' },
    resolved: { variant: 'default', label: 'Resolved' },
    dismissed: { variant: 'outline', label: 'Dismissed' },
  };

  const config = variants[status] ?? variants.pending;
  if (!config) return null;

  return <Badge variant={config?.variant}>{config?.label}</Badge>;
}
