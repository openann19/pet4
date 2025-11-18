/**
 * Photo Moderation Queue Admin Component
 *
 * Admin interface for managing photo moderation queue with full audit trail.
 */

'use client';

import { photoModerationAPI } from '@/api/photo-moderation-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type {
  PhotoModerationAuditLog,
  PhotoModerationRecord,
  PhotoModerationStatus,
} from '@/core/domain/photo-moderation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/lib/i18n';
import { createLogger } from '@/lib/logger';
import { userService } from '@/lib/user-service';
import { CheckCircle, Clock, Eye, Shield, Warning, XCircle } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('PhotoModerationQueueAdmin');

export function PhotoModerationQueueAdmin() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const [selectedTab, setSelectedTab] = useState<PhotoModerationStatus>('pending');
  const [records, setRecords] = useState<PhotoModerationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PhotoModerationRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<PhotoModerationAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [stats, setStats] = useState({
    pending: 0,
    scanning: 0,
    heldForKYC: 0,
    quarantined: 0,
    total: 0,
  });

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      let loadedRecords: PhotoModerationRecord[] = [];

      switch (selectedTab) {
        case 'pending':
          loadedRecords = await photoModerationAPI.getPendingPhotos(50);
          break;
        case 'quarantined':
          loadedRecords = await photoModerationAPI.getQuarantinedPhotos(50);
          break;
        case 'held_for_kyc':
          loadedRecords = await photoModerationAPI.getPendingPhotos(50);
          break;
        default:
          loadedRecords = [];
      }

      setRecords(loadedRecords);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to load records', err);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  const loadStats = useCallback(async () => {
    try {
      const queueStats = await photoModerationAPI.getQueueStats();
      setStats(queueStats);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to load stats', err);
    }
  }, []);

  const loadAuditLogs = useCallback(async (photoId: string) => {
    try {
      const logs = await photoModerationAPI.getAuditLogs(photoId);
      setAuditLogs(logs);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to load audit logs', err);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
    void loadStats();
  }, [loadRecords, loadStats]);

  useEffect(() => {
    if (selectedRecord) {
      void loadAuditLogs(selectedRecord.photoId).catch((error) => {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Failed to load audit logs in useEffect', err);
      });
    }
  }, [selectedRecord, loadAuditLogs]);

  const handleApprove = async () => {
    if (!selectedRecord) return;

    try {
      setLoading(true);
      const user = await userService.user();
      if (!user) {
        throw new Error('Moderator context unavailable');
      }

      await photoModerationAPI.updateStatus({
        photoId: selectedRecord.photoId,
        action: 'approve',
        performedBy: user.id,
        status: 'approved',
        reason: decisionReason,
      });

      toast.success(t.photoModeration.photoApproved);
      await loadRecords();
      await loadStats();
      setSelectedRecord(null);
      setDecisionReason('');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to approve photo', err);
      toast.error('Failed to approve photo');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord || !decisionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      const user = await userService.user();
      if (!user) {
        throw new Error('Moderator context unavailable');
      }

      await photoModerationAPI.updateStatus({
        photoId: selectedRecord.photoId,
        action: 'reject',
        performedBy: user.id,
        status: 'rejected',
        rejectionReason: decisionReason,
        reason: decisionReason,
      });

      toast.success(t.photoModeration.photoRejected);
      await loadRecords();
      await loadStats();
      setSelectedRecord(null);
      setDecisionReason('');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to reject photo', err);
      toast.error('Failed to reject photo');
    } finally {
      setLoading(false);
    }
  };

  const handleQuarantine = async () => {
    if (!selectedRecord) return;

    try {
      setLoading(true);
      const user = await userService.user();
      if (!user) {
        throw new Error('Moderator context unavailable');
      }

      await photoModerationAPI.updateStatus({
        photoId: selectedRecord.photoId,
        action: 'quarantine',
        performedBy: user.id,
        status: 'quarantined',
        reason: decisionReason || 'Quarantined by moderator',
      });

      toast.success(t.photoModeration.photoQuarantined);
      await loadRecords();
      await loadStats();
      setSelectedRecord(null);
      setDecisionReason('');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to quarantine photo', err);
      toast.error('Failed to quarantine photo');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFromQuarantine = async () => {
    if (!selectedRecord) return;

    try {
      setLoading(true);
      const user = await userService.user();
      if (!user) {
        throw new Error('Moderator context unavailable');
      }

      await photoModerationAPI.updateStatus({
        photoId: selectedRecord.photoId,
        action: 'release_from_quarantine',
        performedBy: user.id,
        status: 'approved',
        reason: decisionReason || 'Released from quarantine',
      });

      toast.success('Photo released from quarantine');
      await loadRecords();
      await loadStats();
      setSelectedRecord(null);
      setDecisionReason('');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to release from quarantine', err);
      toast.error('Failed to release from quarantine');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PhotoModerationStatus) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.photoModeration.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {t.photoModeration.rejected}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {t.photoModeration.pending}
          </Badge>
        );
      case 'scanning':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {t.photoModeration.scanning}
          </Badge>
        );
      case 'held_for_kyc':
        return (
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            {t.photoModeration.heldForKYC}
          </Badge>
        );
      case 'quarantined':
        return (
          <Badge variant="destructive">
            <Warning className="w-3 h-3 mr-1" />
            {t.photoModeration.quarantined}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.photoModeration.title}</h1>
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">{t.photoModeration.totalPending}</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              {t.photoModeration.totalQuarantined}
            </div>
            <div className="text-2xl font-bold">{stats.quarantined}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">{t.photoModeration.totalHeldForKYC}</div>
            <div className="text-2xl font-bold">{stats.heldForKYC}</div>
          </Card>
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as PhotoModerationStatus)}
      >
        <TabsList>
          <TabsTrigger value="pending">
            {t.photoModeration.pending} ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="quarantined">
            {t.photoModeration.quarantined} ({stats.quarantined})
          </TabsTrigger>
          <TabsTrigger value="held_for_kyc">
            {t.photoModeration.heldForKYC} ({stats.heldForKYC})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <ScrollArea className="h-150">
            {loading && records.length === 0 ? (
              <div className="text-center py-12">Loading...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {selectedTab === 'pending' && t.photoModeration.noPhotosPending}
                {selectedTab === 'quarantined' && t.photoModeration.noPhotosQuarantined}
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card
                    key={record.photoId}
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedRecord(record); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(record.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(record.metadata.uploadedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div>Photo ID: {record.photoId}</div>
                          {record.scanResult && (
                            <div className="mt-1">
                              NSFW Score: {(record.scanResult.nsfwScore * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedRecord !== null}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>Photo Moderation Details</DialogTitle>
                <DialogDescription>Photo ID: {selectedRecord.photoId}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">
                      {t.photoModeration.moderationStatus}
                    </div>
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">{t.photoModeration.uploadDate}</div>
                    <div className="text-sm">
                      {new Date(selectedRecord.metadata.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedRecord.scanResult && (
                    <>
                      <div>
                        <div className="text-sm font-medium mb-1">
                          {t.photoModeration.nsfwScore}
                        </div>
                        <div className="text-sm">
                          {(selectedRecord.scanResult.nsfwScore * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">
                          {t.photoModeration.requiresReview}
                        </div>
                        <div className="text-sm">
                          {selectedRecord.scanResult.requiresManualReview ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedRecord.scanResult &&
                  selectedRecord.scanResult.detectedIssues.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Detected Issues</div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {selectedRecord.scanResult.detectedIssues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div>
                  <div className="text-sm font-medium mb-2">{t.photoModeration.auditLog}</div>
                  <ScrollArea className="h-50 border rounded p-4">
                    {auditLogs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No audit logs</div>
                    ) : (
                      <div className="space-y-2">
                        {auditLogs.map((log) => (
                          <div key={log.auditId} className="text-sm border-b pb-2">
                            <div className="font-medium">{log.action}</div>
                            <div className="text-muted-foreground">
                              {log.previousStatus} → {log.newStatus}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.performedAt), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Decision Reason</div>
                  <Textarea
                    value={decisionReason}
                    onChange={(e) => { setDecisionReason(e.target.value); }}
                    placeholder="Enter reason for decision..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  {selectedRecord.status === 'pending' || selectedRecord.status === 'scanning' ? (
                    <>
                      <Button
                        onClick={() => {
                          void handleApprove().catch((error) => {
                            const err = _error instanceof Error ? _error : new Error(String(_error));
                            logger.error('Failed to approve from button', err);
                          });
                        }}
                        variant="primary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t.photoModeration.approvePhoto}
                      </Button>
                      <Button
                        onClick={() => {
                          void handleReject().catch((error) => {
                            const err = _error instanceof Error ? _error : new Error(String(_error));
                            logger.error('Failed to reject from button', err);
                          });
                        }}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t.photoModeration.rejectPhoto}
                      </Button>
                      <Button
                        onClick={() => {
                          void handleQuarantine().catch((error) => {
                            const err = _error instanceof Error ? _error : new Error(String(_error));
                            logger.error('Failed to quarantine from button', err);
                          });
                        }}
                        variant="outline"
                      >
                        <Warning className="w-4 h-4 mr-2" />
                        {t.photoModeration.quarantinePhoto}
                      </Button>
                    </>
                  ) : selectedRecord.status === 'quarantined' ? (
                    <>
                      <Button
                        onClick={() => {
                          void handleApprove().catch((error) => {
                            const err = _error instanceof Error ? _error : new Error(String(_error));
                            logger.error('Failed to approve from button', err);
                          });
                        }}
                        variant="primary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t.photoModeration.approvePhoto}
                      </Button>
                      <Button
                        onClick={() => {
                          void handleReleaseFromQuarantine().catch((error) => {
                            const err = _error instanceof Error ? _error : new Error(String(_error));
                            logger.error('Failed to release from quarantine from button', err);
                          });
                        }}
                        variant="outline"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t.photoModeration.releaseFromQuarantine}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
