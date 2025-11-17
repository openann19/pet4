import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStorage } from '@/hooks/use-storage';
import { adoptionService } from '@/lib/adoption-service';
import type { AdoptionApplication, AdoptionProfile } from '@/lib/adoption-types';
import { createLogger } from '@/lib/logger';
import { userService } from '@/lib/user-service';
import { MotionView } from '@petspark/motion';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardText,
  Clock,
  EnvelopeSimple,
  House,
  PawPrint,
  Phone,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { isTruthy } from '@petspark/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('MyApplicationsView');

interface MyApplicationsViewProps {
  onBack: () => void;
}

interface ApplicationWithProfile extends AdoptionApplication {
  profile?: AdoptionProfile;
}

export function MyApplicationsView({ onBack }: MyApplicationsViewProps) {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [profiles] = useStorage<AdoptionProfile[]>('adoption-profiles', []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const user = await userService.user();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      const userApps = await adoptionService.getUserApplications(user.id);

      const appsWithProfiles: ApplicationWithProfile[] = userApps.map((app) => {
        const profile = (profiles ?? []).find((p) => p._id === app.adoptionProfileId);
        const result: ApplicationWithProfile = {
          ...app,
        };
        if (isTruthy(profile)) {
          result.profile = profile;
        }
        return result;
      });

      setApplications(
        appsWithProfiles.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
      );
    } catch (error) {
      logger.error(
        'Failed to load applications',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AdoptionApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'withdrawn':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: AdoptionApplication['status']) => {
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

  const getStatusMessage = (status: AdoptionApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'Your application is being reviewed by the shelter. You should hear back soon.';
      case 'approved':
        return 'Congratulations! Your application has been approved. The shelter will contact you to arrange the adoption.';
      case 'rejected':
        return 'Unfortunately, your application was not approved at this time. Please consider applying for other pets.';
      case 'withdrawn':
        return 'This application has been withdrawn.';
    }
  };

  if (isTruthy(isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <MotionView
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <ClipboardText size={48} className="text-primary" weight="fill" />
          </MotionView>
          <p className="mt-4 text-muted-foreground">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <IconButton
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={20} weight="bold" />}
          onClick={onBack}
          className="rounded-full w-10 h-10 p-0"
          ariaLabel="Go back"
        />
        <div>
          <h2 className="text-3xl font-bold">My Applications</h2>
          <p className="text-muted-foreground">Track the status of your adoption applications</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardText size={64} className="text-muted-foreground mb-4" weight="thin" />
            <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't submitted any adoption applications yet. Browse available pets and apply
              to adopt your perfect companion!
            </p>
            <Button onClick={onBack} className="mt-6">
              Browse Pets
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4 pr-4">
            {applications.map((application, index) => (
              <MotionView
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`overflow-hidden ${application.status === 'approved'
                      ? 'border-green-500/30 shadow-lg shadow-green-500/5'
                      : application.status === 'pending'
                        ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : ''
                    }`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20 border-2 border-primary/20">
                        {application.profile?.petPhoto ? (
                          <AvatarImage
                            src={application.profile.petPhoto}
                            alt={application.profile.petName}
                          />
                        ) : null}
                        <AvatarFallback>
                          <PawPrint size={32} weight="fill" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <CardTitle className="text-2xl">
                              {application.profile?.petName ?? 'Unknown Pet'}
                            </CardTitle>
                            <CardDescription>
                              {application.profile?.breed} • {application.profile?.age} years old
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className={getStatusColor(application.status)}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Submitted on{' '}
                          {new Date(application.submittedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div
                      className={`p-4 rounded-lg border ${application.status === 'approved'
                          ? 'bg-green-500/5 border-green-500/20'
                          : application.status === 'pending'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : application.status === 'rejected'
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-muted/30 border-border'
                        }`}
                    >
                      <p className="text-sm font-medium mb-1">Status Update</p>
                      <p className="text-sm text-muted-foreground">
                        {getStatusMessage(application.status)}
                      </p>
                    </div>

                    {application.reviewNotes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Notes from the Shelter</p>
                          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            {application.reviewNotes}
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Your Information</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <EnvelopeSimple size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {application.applicantEmail}
                            </span>
                          </div>
                          {application.applicantPhone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {application.applicantPhone}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <House size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground capitalize">
                              {application.householdType}
                              {application.hasYard && ' • Has Yard'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Shelter Contact</p>
                        <div className="space-y-1 text-sm">
                          {application.profile?.shelterName && (
                            <p className="font-medium">{application.profile.shelterName}</p>
                          )}
                          {application.profile?.contactEmail && (
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {application.profile.contactEmail}
                              </span>
                            </div>
                          )}
                          {application.profile?.contactPhone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {application.profile.contactPhone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionView>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
