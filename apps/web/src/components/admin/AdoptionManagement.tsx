'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  Heart,
  PawPrint,
  CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useStaggeredItem } from '@/effects/reanimated';
import { adoptionApi } from '@/api/adoption-api';
import { createLogger } from '@/lib/logger';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { AdoptionCard } from '@/components/adoption/AdoptionCard';

const logger = createLogger('AdoptionManagement');

type TabValue = 'all' | 'available' | 'pending' | 'adopted' | 'flagged' | 'hidden';

interface AdoptionProfileCardProps {
  profile: AdoptionProfile;
  index: number;
  isHidden: boolean;
  onHide: (profileId: string) => void;
  onUnhide: (profileId: string) => void;
  onDelete: (profile: AdoptionProfile) => void;
}

function AdoptionProfileCard({
  profile,
  index,
  isHidden,
  onHide,
  onUnhide,
  onDelete,
}: AdoptionProfileCardProps): JSX.Element {
  const animation = useStaggeredItem({ index, staggerDelay: 50 });

  return (
    <AnimatedView
      style={animation.itemStyle}
      className="relative"
      role="article"
      aria-label={`Adoption profile for ${profile.petName}`}
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {isHidden ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onUnhide(profile._id)}
            aria-label={`Unhide ${profile.petName}`}
          >
            <Eye size={16} className="mr-2" aria-hidden="true" />
            Unhide
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHide(profile._id)}
            aria-label={`Hide ${profile.petName}`}
          >
            <EyeSlash size={16} className="mr-2" aria-hidden="true" />
            Hide
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(profile)}
          aria-label={`Delete ${profile.petName}`}
        >
          <Trash size={16} className="mr-2" aria-hidden="true" />
          Delete
        </Button>
      </div>
      <AdoptionCard
        profile={profile}
        onFavorite={() => {}}
        isFavorited={false}
        onSelect={() => {}}
      />
    </AnimatedView>
  );
}

interface AdoptionManagementStats {
  total: number;
  available: number;
  pending: number;
  adopted: number;
  flagged: number;
  hidden: number;
  last7days: number;
}

export default function AdoptionManagement(): JSX.Element {
  const [profiles] = useStorage<AdoptionProfile[]>('adoption-profiles', []);
  const [flaggedProfiles] = useStorage<string[]>('flagged-adoption-profiles', []);
  const [hiddenProfiles, setHiddenProfiles] = useStorage<string[]>('hidden-adoption-profiles', []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<AdoptionProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const allProfiles = useMemo<AdoptionProfile[]>(() => profiles || [], [profiles]);
  const flaggedProfilesList = useMemo<AdoptionProfile[]>(
    () => allProfiles.filter((p) => flaggedProfiles?.includes(p._id)),
    [allProfiles, flaggedProfiles]
  );
  const hiddenProfilesList = useMemo<AdoptionProfile[]>(
    () => allProfiles.filter((p) => hiddenProfiles?.includes(p._id)),
    [allProfiles, hiddenProfiles]
  );

  const filteredProfiles = useMemo<AdoptionProfile[]>(() => {
    let list = allProfiles;

    if (activeTab === 'flagged') {
      list = flaggedProfilesList;
    } else if (activeTab === 'hidden') {
      list = hiddenProfilesList;
    } else if (activeTab !== 'all') {
      list = list.filter((p) => p.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.petName?.toLowerCase().includes(query) ||
          p.breed?.toLowerCase().includes(query) ||
          p.shelterName?.toLowerCase().includes(query)
      );
    }

    return list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  }, [allProfiles, activeTab, flaggedProfilesList, hiddenProfilesList, searchQuery]);

  const handleHideProfile = useCallback(
    (profileId: string): void => {
      try {
        setHiddenProfiles((prev) => {
          const current = prev || [];
          if (current.includes(profileId)) {
            return current;
          }
          return [...current, profileId];
        });
        toast.success('Adoption profile hidden');
        logger.info('Profile hidden', { profileId });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to hide profile', err, { profileId });
        toast.error('Failed to hide profile');
      }
    },
    [setHiddenProfiles]
  );

  const handleUnhideProfile = useCallback(
    (profileId: string): void => {
      try {
        setHiddenProfiles((prev) => (prev || []).filter((id) => id !== profileId));
        toast.success('Adoption profile restored');
        logger.info('Profile unhidden', { profileId });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to unhide profile', err, { profileId });
        toast.error('Failed to restore profile');
      }
    },
    [setHiddenProfiles]
  );

  const handleDeleteProfile = useCallback(async (): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    setIsDeleting(true);
    try {
      await adoptionApi.deleteProfile(selectedProfile._id);
      toast.success('Adoption profile deleted successfully');
      logger.info('Profile deleted', { profileId: selectedProfile._id });
      setShowDeleteDialog(false);
      setSelectedProfile(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete profile', err, { profileId: selectedProfile._id });
      toast.error('Failed to delete adoption profile. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedProfile]);

  const handleDeleteClick = useCallback((profile: AdoptionProfile): void => {
    setSelectedProfile(profile);
    setShowDeleteDialog(true);
  }, []);

  const stats = useMemo<AdoptionManagementStats>(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      total: allProfiles.length,
      available: allProfiles.filter((p) => p.status === 'available').length,
      pending: allProfiles.filter((p) => p.status === 'pending').length,
      adopted: allProfiles.filter((p) => p.status === 'adopted').length,
      flagged: flaggedProfilesList.length,
      hidden: hiddenProfilesList.length,
      last7days: allProfiles.filter((p) => new Date(p.postedDate).getTime() > sevenDaysAgo).length,
    };
  }, [allProfiles, flaggedProfilesList.length, hiddenProfilesList.length]);

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-6"
      role="main"
      aria-label="Adoption Management"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adoption Profiles</h1>
          <p className="text-muted-foreground">Manage adoption listings and applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Statistics">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profiles</p>
                <p className="text-2xl font-bold" aria-live="polite">
                  {stats.total}
                </p>
              </div>
              <PawPrint size={32} className="text-primary" weight="fill" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold" aria-live="polite">
                  {stats.available}
                </p>
              </div>
              <Heart size={32} className="text-accent" weight="fill" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold" aria-live="polite">
                  {stats.pending}
                </p>
              </div>
              <Eye size={32} className="text-secondary" weight="fill" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Adopted</p>
                <p className="text-2xl font-bold" aria-live="polite">
                  {stats.adopted}
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500" weight="fill" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adoption Profiles</CardTitle>
          <CardDescription>Search and filter adoption listings</CardDescription>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <label htmlFor="adoption-search" className="sr-only">
                  Search adoption profiles
                </label>
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                  aria-hidden="true"
                />
                <Input
                  id="adoption-search"
                  placeholder="Search by name, breed, or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search adoption profiles"
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList role="tablist" aria-label="Filter adoption profiles">
                <TabsTrigger value="all" role="tab" aria-selected={activeTab === 'all'}>
                  All
                </TabsTrigger>
                <TabsTrigger value="available" role="tab" aria-selected={activeTab === 'available'}>
                  Available
                </TabsTrigger>
                <TabsTrigger value="pending" role="tab" aria-selected={activeTab === 'pending'}>
                  Pending
                </TabsTrigger>
                <TabsTrigger value="adopted" role="tab" aria-selected={activeTab === 'adopted'}>
                  Adopted
                </TabsTrigger>
                <TabsTrigger value="flagged" role="tab" aria-selected={activeTab === 'flagged'}>
                  Flagged{' '}
                  {stats.flagged > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.flagged}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="hidden" role="tab" aria-selected={activeTab === 'hidden'}>
                  Hidden
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]" role="region" aria-label="Adoption profiles list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.length === 0 ? (
                <div className="col-span-full text-center py-12" role="status" aria-live="polite">
                  <p className="text-muted-foreground">No adoption profiles found</p>
                </div>
              ) : (
                filteredProfiles.map((profile, index) => (
                  <AdoptionProfileCard
                    key={profile._id}
                    profile={profile}
                    index={index}
                    isHidden={hiddenProfiles?.includes(profile._id) ?? false}
                    onHide={handleHideProfile}
                    onUnhide={handleUnhideProfile}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent
          role="alertdialog"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="delete-dialog-title">Delete Adoption Profile</DialogTitle>
            <DialogDescription id="delete-dialog-description">
              Are you sure you want to delete this adoption profile? This action cannot be undone.
              {selectedProfile && (
                <span className="block mt-2 font-semibold">Profile: {selectedProfile.petName}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              aria-label="Cancel deletion"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting}
              aria-label="Confirm deletion"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
