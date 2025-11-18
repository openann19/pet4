'use client';

import { MotionView, type MotionStyle } from "@petspark/motion";
import { adoptionApi } from '@/api/adoption-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isTruthy } from '@petspark/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { AdoptionApplication, AdoptionProfile } from '@/lib/adoption-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import {
  Calendar,
  CaretDown,
  CaretUp,
  ChatCircle,
  CheckCircle,
  ClipboardText,
  Clock,
  EnvelopeSimple,
  House,
  MagnifyingGlass,
  PawPrint,
  Phone,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item';
import { useExpandCollapse } from '@/effects/reanimated/use-expand-collapse';
import { useRotation } from '@/effects/reanimated/use-rotation';

const logger = createLogger('AdoptionApplicationReview');

function LoadingSpinner() {
  const rotationAnimation = useRotation({
    enabled: true,
    duration: 1000,
    repeat: true,
  });

  return (
    <>
      <MotionView style={rotationAnimation.rotationStyle as unknown as MotionStyle} className="mr-2 inline-block">
        <Clock size={16} />
      </MotionView>
      Processing...
    </>
  );
}

interface ApplicationCardProps {
  application: ApplicationWithProfile;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: (appId: string) => void;
  onReviewClick: (application: ApplicationWithProfile, action: 'approve' | 'reject') => void;
  getStatusColor: (status: ApplicationStatus) => string;
  getStatusIcon: (status: ApplicationStatus) => React.ReactNode;
}

function ApplicationCard({
  application,
  index,
  isExpanded,
  onToggleExpanded,
  onReviewClick,
  getStatusColor,
  getStatusIcon,
}: ApplicationCardProps) {
  const staggeredAnimation = useStaggeredItem({
    index,
    delay: 0,
    staggerDelay: 50,
  });
  const expandAnimation = useExpandCollapse({
    isExpanded,
    duration: 300,
    enableOpacity: true,
  });

  return (
    <MotionView key={application._id} style={staggeredAnimation.itemStyle as unknown as MotionStyle}>
      <Card
        className={`overflow-hidden transition-all duration-300 ${
          application.status === 'pending' ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {application.profile?.petPhoto ? (
                <AvatarImage src={application.profile.petPhoto} alt={application.profile.petName} />
              ) : null}
              <AvatarFallback>
                <PawPrint size={24} weight="fill" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {application.applicantName}
                    {application.status === 'pending' && (
                      <Badge variant="secondary" className={getStatusColor(application.status)}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">Pending Review</span>
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Applying for:{' '}
                    <span className="font-medium text-foreground">
                      {application.profile?.petName ?? 'Unknown Pet'}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted{' '}
                    {new Date(application.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {application.status !== 'pending' && (
                  <Badge variant="secondary" className={getStatusColor(application.status)}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status}</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <EnvelopeSimple size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground truncate">{application.applicantEmail}</span>
            </div>
            {application.applicantPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">{application.applicantPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <House size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{application.householdType}</span>
              {application.hasYard && <span className="text-xs text-green-600">• Has Yard</span>}
            </div>
          </div>

          {isExpanded && (
            <MotionView style={expandAnimation.heightStyle as unknown as MotionStyle} className="overflow-hidden">
              <Separator className="my-3" />

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Household Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">Other Pets:</span>
                        <span className="font-medium">
                          {application.hasOtherPets ? 'Yes' : 'No'}
                        </span>
                      </p>
                      {application.hasOtherPets && application.otherPetsDetails && (
                        <p className="text-muted-foreground text-xs pl-4">
                          {application.otherPetsDetails}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">Children:</span>
                        <span className="font-medium">
                          {application.hasChildren ? 'Yes' : 'No'}
                        </span>
                      </p>
                      {application.hasChildren && application.childrenAges && (
                        <p className="text-muted-foreground text-xs pl-4">
                          Ages: {application.childrenAges}
                        </p>
                      )}
                    </div>
                  </div>

                  {application.experience && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Pet Experience</h4>
                      <p className="text-sm text-muted-foreground">{application.experience}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Why They Want to Adopt</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {application.reason}
                  </p>
                </div>

                {application.reviewNotes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ChatCircle size={16} weight="fill" />
                      Review Notes
                    </h4>
                    <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
                      {application.reviewNotes}
                    </p>
                    {application.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed on{' '}
                        {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </MotionView>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { onToggleExpanded(application._id); }}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <CaretUp size={16} weight="bold" />
                Show Less
              </>
            ) : (
              <>
                <CaretDown size={16} weight="bold" />
                Show Details
              </>
            )}
          </Button>

          {application.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onReviewClick(application, 'reject'); }}
                className="gap-2 border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
              >
                <XCircle size={16} weight="fill" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => { onReviewClick(application, 'approve'); }}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={16} weight="fill" />
                Approve
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </MotionView>
  );
}

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

interface ApplicationWithProfile {
  _id: string;
  adoptionProfileId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  householdType: 'house' | 'apartment' | 'condo' | 'other';
  hasYard: boolean;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  childrenAges?: string;
  experience: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  profile?: AdoptionProfile;
}

export default function AdoptionApplicationReview() {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [profiles, setProfiles] = useState<AdoptionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithProfile | null>(
    null
  );
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('pending');
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [appsData, profilesData] = await Promise.all([
          adoptionApi.getAllApplications(),
          adoptionApi.getAdoptionProfiles({}),
        ]);
        setApplications(appsData);
        setProfiles(profilesData.profiles);
      } catch (error) {
        logger.error(
          'Failed to load applications',
          error instanceof Error ? error : new Error(String(error))
        );
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const applicationsWithProfiles: ApplicationWithProfile[] = applications.map((app) => {
    const profile = profiles.find((p) => p._id === app.adoptionProfileId);
    const result: ApplicationWithProfile = {
      ...app,
    };
    if (profile !== undefined) {
      result.profile = profile;
    }
    return result;
  });

  const filteredApplications = () => {
    let list = applicationsWithProfiles;

    if (activeTab !== 'all') {
      list = list.filter((app) => app.status === activeTab);
    }

    if (searchQuery) {
      list = list.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.profile?.petName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  };

  const handleReviewClick = useCallback(
    (application: ApplicationWithProfile, action: 'approve' | 'reject') => {
      try {
        setSelectedApplication(application);
        setReviewAction(action);
        setReviewNotes('');
        setShowReviewDialog(true);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to open review dialog', err, {
          applicationId: application._id,
          action,
        });
      }
    },
    []
  );

  const handleSubmitReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    setIsSubmitting(true);
    haptics.trigger('light');

    try {
      const newStatus = reviewAction === 'approve' ? ('approved' as const) : ('rejected' as const);

      const updateRequest: {
        status: 'approved' | 'rejected';
        reviewNotes?: string;
      } = {
        status: newStatus,
      };
      if (reviewNotes.trim()) {
        updateRequest.reviewNotes = reviewNotes.trim();
      }

      await adoptionApi.updateApplicationStatus(selectedApplication._id, updateRequest);

      // Update local state
      setApplications((prev) =>
        prev.map((app) => {
          if (app._id === selectedApplication._id) {
            const updated: AdoptionApplication = {
              ...app,
              status: newStatus,
              reviewedAt: new Date().toISOString(),
              ...(reviewNotes.trim() ? { reviewNotes: reviewNotes.trim() } : {}),
            };
            return updated;
          }
          return app;
        })
      );

      // If approved, update profile status
      if (reviewAction === 'approve' && selectedApplication.profile) {
        await adoptionApi.updateProfileStatus(selectedApplication.adoptionProfileId, 'pending');
        setProfiles((prev) =>
          prev.map((p) =>
            p._id === selectedApplication.adoptionProfileId
              ? { ...p, status: 'pending' as const }
              : p
          )
        );
      }

      haptics.trigger('success');
      toast.success(reviewAction === 'approve' ? 'Application Approved!' : 'Application Rejected', {
        description:
          reviewAction === 'approve'
            ? `${selectedApplication.applicantName} has been approved to adopt ${selectedApplication.profile?.petName ?? 'this pet'}.`
            : `Application from ${selectedApplication.applicantName} has been rejected.`,
      });

      setShowReviewDialog(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (error) {
      logger.error(
        'Failed to submit review',
        error instanceof Error ? error : new Error(String(error))
      );
      haptics.trigger('error');
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpanded = useCallback((appId: string) => {
    try {
      setExpandedApplications((prev) => {
        const next = new Set(prev);
        if (next.has(appId)) {
          next.delete(appId);
        } else {
          next.add(appId);
        }
        return next;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle expanded state', err, { appId });
    }
  }, []);

  const stats = {
    total: applicationsWithProfiles.length,
    pending: applicationsWithProfiles.filter((app) => app.status === 'pending').length,
    approved: applicationsWithProfiles.filter((app) => app.status === 'approved').length,
    rejected: applicationsWithProfiles.filter((app) => app.status === 'rejected').length,
    withdrawn: applicationsWithProfiles.filter((app) => app.status === 'withdrawn').length,
    last7days: applicationsWithProfiles.filter(
      (app) => new Date(app.submittedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length,
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'withdrawn':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} weight="fill" />;
      case 'approved':
        return <CheckCircle size={16} weight="fill" />;
      case 'rejected':
        return <XCircle size={16} weight="fill" />;
      case 'withdrawn':
        return <Warning size={16} weight="fill" />;
    }
  };

  if (isTruthy(loading)) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Adoption Applications</h2>
          <p className="text-muted-foreground">Review and manage adoption applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardText size={32} className="text-primary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock size={32} className="text-amber-500" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle size={32} className="text-green-500" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle size={32} className="text-red-500" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                <p className="text-2xl font-bold">{stats.last7days}</p>
              </div>
              <Calendar size={32} className="text-secondary" weight="fill" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <Input
                  placeholder="Search by applicant name, email, or pet name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); }}>
              <TabsList>
                <TabsTrigger value="all">
                  All{' '}
                  {stats.total > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending{' '}
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-700">
                      {stats.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved{' '}
                  {stats.approved > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.approved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected{' '}
                  {stats.rejected > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-175 pr-4">
            <div className="space-y-3">
              {filteredApplications().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              ) : (
                filteredApplications().map((application, index) => (
                  <ApplicationCard
                    key={application._id}
                    application={application}
                    index={index}
                    isExpanded={expandedApplications.has(application._id)}
                    onToggleExpanded={toggleExpanded}
                    onReviewClick={handleReviewClick}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle size={24} weight="fill" className="text-green-600" />
                  Approve Application
                </>
              ) : (
                <>
                  <XCircle size={24} weight="fill" className="text-red-600" />
                  Reject Application
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? `You are approving ${selectedApplication?.applicantName}'s application to adopt ${selectedApplication?.profile?.petName}.`
                : `You are rejecting ${selectedApplication?.applicantName}'s application to adopt ${selectedApplication?.profile?.petName}.`}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {selectedApplication.profile?.petPhoto ? (
                        <AvatarImage
                          src={selectedApplication.profile.petPhoto}
                          alt={selectedApplication.profile.petName}
                        />
                      ) : null}
                      <AvatarFallback>
                        <PawPrint size={20} weight="fill" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedApplication.applicantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedApplication.applicantEmail}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="review-notes">
                  {reviewAction === 'approve'
                    ? 'Approval Notes (Optional)'
                    : 'Rejection Reason (Optional)'}
                </Label>
                <Textarea
                  id="review-notes"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Add any notes for the approval...'
                      : 'Explain why this application is being rejected...'
                  }
                  value={reviewNotes}
                  onChange={(e) => { setReviewNotes(e.target.value); }}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {reviewAction === 'approve'
                    ? 'These notes will be saved with the application record.'
                    : 'These notes will help improve future application reviews.'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setReviewNotes('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSubmitReview();
              }}
              disabled={isSubmitting}
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isSubmitting ? (
                <LoadingSpinner />
              ) : (
                <>{reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
