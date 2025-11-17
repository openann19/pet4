import { MotionView } from "@petspark/motion";
import { verificationApi } from '@/api/verification-api';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type {
  VerificationLevel,
  VerificationRequest as VerificationRequestType,
  VerificationStatus,
} from '@/lib/verification-types';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  File,
  Image as ImageIcon,
  ShieldCheck,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('VerificationReviewDashboard');

type VerificationRequest = VerificationRequestType;

export function VerificationReviewDashboard(): JSX.Element {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<VerificationStatus | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadVerificationRequests = useCallback(async (): Promise<void> => {
    try {
      setInitialLoading(true);
      const filters: { status?: VerificationStatus[] } | undefined =
        selectedTab !== 'all' ? { status: [selectedTab] } : undefined;
      const requests = await verificationApi.getVerificationRequests(filters);
      setVerificationRequests(requests);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load verification requests', err);
      toast.error('Failed to load verification requests');
    } finally {
      setInitialLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    void loadVerificationRequests();
  }, [loadVerificationRequests]);

  const filteredRequests = verificationRequests.filter((r) => {
    if (selectedTab === 'all') return true;
    return r.status === selectedTab;
  });

  // Animation presences
  const loadingPresence = useAnimatePresence({
    isVisible: initialLoading,
    enterTransition: 'fade',
    exitTransition: 'fade',
  });

  const emptyPresence = useAnimatePresence({
    isVisible: !initialLoading && filteredRequests.length === 0,
    enterTransition: 'scale',
    exitTransition: 'fade',
  });

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'expired':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getLevelColor = (level: VerificationLevel) => {
    switch (level) {
      case 'premium':
        return 'bg-linear-to-r from-yellow-500 to-orange-500 text-white';
      case 'standard':
        return 'bg-linear-to-r from-blue-500 to-purple-500 text-white';
      default:
        return 'bg-linear-to-r from-green-500 to-teal-500 text-white';
    }
  };

  const getLevelIcon = (level: VerificationLevel) => {
    switch (level) {
      case 'premium':
        return '👑';
      case 'standard':
        return '⭐';
      default:
        return '✓';
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={16} weight="fill" />;
      case 'rejected':
        return <XCircle size={16} weight="fill" />;
      case 'pending':
        return <Clock size={16} />;
      case 'expired':
        return <Warning size={16} />;
      default:
        return <ShieldCheck size={16} />;
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    haptics.impact('medium');

    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await verificationApi.updateVerificationStatus(
        selectedRequest.id,
        'approved' as 'approved' | 'rejected',
        user.id,
        reviewNotes
      );

      haptics.success();
      toast.success('Verification Approved!', {
        description: 'Pet verification has been approved',
      });

      setSelectedRequest(null);
      setReviewNotes('');
      await loadVerificationRequests();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to approve verification', err);
      haptics.error();
      toast.error('Failed to approve verification');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    haptics.impact('medium');

    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await verificationApi.updateVerificationStatus(
        selectedRequest.id,
        'rejected',
        user.id,
        `${rejectionReason}${reviewNotes ? '\n\n' + reviewNotes : ''}`
      );

      haptics.trigger('heavy');
      toast.error('Verification Rejected', {
        description: 'User has been notified of the rejection reason',
      });

      setSelectedRequest(null);
      setReviewNotes('');
      setRejectionReason('');
      await loadVerificationRequests();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reject verification', err);
      haptics.error();
      toast.error('Failed to reject verification');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: verificationRequests.length,
    pending: verificationRequests.filter((r) => r.status === 'pending').length,
    verified: verificationRequests.filter((r) => r.status === 'verified').length,
    rejected: verificationRequests.filter((r) => r.status === 'rejected').length,
    approvalRate:
      verificationRequests.length > 0
        ? Math.round(
            (verificationRequests.filter((r) => r.status === 'verified').length /
              verificationRequests.length) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
            <ShieldCheck size={28} weight="fill" className="text-primary shrink-0" />
            <span className="wrap-break-word">KYC Verification Review Dashboard</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve pet owner verification requests
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="p-4 bg-linear-to-br from-background to-muted/20">
          <div className="text-sm text-muted-foreground">Total Requests</div>
          <div className="text-3xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock size={14} />
            Pending Review
          </div>
          <div className="text-3xl font-bold mt-1 text-orange-500">{stats.pending}</div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <CheckCircle size={14} />
            Verified
          </div>
          <div className="text-3xl font-bold mt-1 text-green-500">{stats.verified}</div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <XCircle size={14} />
            Rejected
          </div>
          <div className="text-3xl font-bold mt-1 text-red-500">{stats.rejected}</div>
        </Card>
        <Card className="p-4 bg-linear-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="text-sm text-muted-foreground">Approval Rate</div>
          <div className="text-3xl font-bold mt-1 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            {stats.approvalRate}%
          </div>
        </Card>
      </div>
      <Tabs
        value={selectedTab}
        onValueChange={(v) => setSelectedTab(v as VerificationStatus | 'all')}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All ({verificationRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="verified" className="text-xs sm:text-sm">
            Verified ({stats.verified})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">
            Rejected ({stats.rejected})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs sm:text-sm col-span-2 sm:col-span-1">
            Expired
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <ScrollArea className="h-125 sm:h-150 pr-2 sm:pr-4">
            {loadingPresence.shouldRender && initialLoading && (
              <MotionView style={useAnimatedStyleValue(loadingPresence.animatedStyle)}>
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading verification requests...</p>
                </div>
              </MotionView>
            )}
            {emptyPresence.shouldRender && !initialLoading && filteredRequests.length === 0 && (
              <MotionView style={useAnimatedStyleValue(emptyPresence.animatedStyle)} className="text-center py-16">
                <ShieldCheck size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg font-medium">
                  No requests in this category
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for new submissions
                </p>
              </MotionView>
            )}
            {!initialLoading && filteredRequests.length > 0 && (
              <div className="space-y-4">
                {filteredRequests.map((request, index) => (
                  <Card
                    key={request.id}
                    className={cn(
                      'p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4',
                      'hover:scale-[1.01] active:scale-[0.99]',
                      request.status === 'pending' && 'border-orange-500/40 bg-orange-500/5'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      haptics.impact('light');
                      setSelectedRequest(request);
                    }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-border shrink-0">
                        <AvatarFallback className="text-base sm:text-lg">
                          {request.petId[0] ?? '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">
                              Pet ID: {request.petId}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              Requested by User {request.userId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className={getStatusColor(request.status)} variant="outline">
                            {getStatusIcon(request.status)}
                            <span className="ml-1.5 font-medium">
                              {request.status.toUpperCase()}
                            </span>
                          </Badge>
                          <Badge
                            className={getLevelColor(request.verificationLevel)}
                            variant="outline"
                          >
                            {getLevelIcon(request.verificationLevel)}{' '}
                            {request.verificationLevel.toUpperCase()}
                          </Badge>
                          {request.trustScore && (
                            <Badge
                              variant="outline"
                              className="bg-linear-to-r from-primary/10 to-accent/10"
                            >
                              Trust Score: {request.trustScore}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <File size={14} />
                            <span>{request.documents.length} documents</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={14} />
                            <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {request.completedAt && (
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            {request.status === 'verified' ? (
                              <>
                                <CheckCircle size={12} className="text-green-500" />
                                Verified on {new Date(request.completedAt).toLocaleString()}
                              </>
                            ) : (
                              <>
                                <XCircle size={12} className="text-red-500" />
                                Rejected on {new Date(request.completedAt).toLocaleString()}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight size={20} className="text-muted-foreground shrink-0 mt-4" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <Dialog
        open={selectedRequest !== null}
        onOpenChange={() => {
          setSelectedRequest(null);
          setReviewNotes('');
          setRejectionReason('');
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <ShieldCheck size={24} weight="fill" className="text-primary shrink-0" />
              <span className="truncate">Verification Request Review</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <ScrollArea className="flex-1 pr-2 sm:pr-4">
              <div className="space-y-4 sm:space-y-6 pb-2">
                <Card className="p-5 bg-linear-to-br from-primary/5 to-accent/5">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-20 w-20 border-2 border-primary">
                      <AvatarFallback className="text-xl">
                        {selectedRequest.petId[0] ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">Pet ID: {selectedRequest.petId}</h3>
                      <p className="text-muted-foreground">User ID: {selectedRequest.userId}</p>
                      <p className="text-sm text-muted-foreground">
                        Request ID: {selectedRequest.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedRequest.status)}>
                          {getStatusIcon(selectedRequest.status)}
                          <span className="ml-1">{selectedRequest.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Level</span>
                      <div className="mt-1">
                        <Badge className={getLevelColor(selectedRequest.verificationLevel)}>
                          {getLevelIcon(selectedRequest.verificationLevel)}{' '}
                          {selectedRequest.verificationLevel}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Requested</span>
                      <p className="font-medium">
                        {new Date(selectedRequest.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Documents</span>
                      <p className="font-medium">{selectedRequest.documents.length} uploaded</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <File size={18} />
                    Submitted Documents
                  </h4>
                  <div className="space-y-3">
                    {selectedRequest.documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-muted/50 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded">
                            {doc.fileName.endsWith('.pdf') ? (
                              <File size={24} className="text-red-500" />
                            ) : (
                              <ImageIcon size={24} className="text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {doc.type.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded{' '}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            haptics.impact('light');
                            if (doc.fileData) {
                              const link = document.createElement('a');
                              link.href = doc.fileData;
                              link.download = doc.fileName;
                              link.click();
                            }
                          }}
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {selectedRequest.reviewNotes && (
                  <Card className="p-5 border-blue-500/40 bg-blue-500/5">
                    <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                      Review Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.reviewNotes}</p>
                    {selectedRequest.reviewedBy && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed by {selectedRequest.reviewedBy} on{' '}
                        {selectedRequest.completedAt
                          ? new Date(selectedRequest.completedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    )}
                  </Card>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Review Notes (Optional)</label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setReviewNotes(e.target.value); }}
                        placeholder="Add any notes about this verification review..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Rejection Reason (Required if rejecting)
                      </label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setRejectionReason(e.target.value); }}
                        placeholder="Provide detailed feedback about why this verification is being rejected..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => { void handleApprove(); }}
                        disabled={loading}
                        className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                        size="lg"
                      >
                        <CheckCircle size={20} weight="fill" className="mr-2" />
                        Approve & Verify
                      </Button>
                      <Button
                        onClick={() => { void handleReject(); }}
                        disabled={loading || !rejectionReason}
                        variant="destructive"
                        className="shadow-lg"
                        size="lg"
                      >
                        <XCircle size={20} weight="fill" className="mr-2" />
                        Reject Request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
