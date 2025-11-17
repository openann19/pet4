import { adoptionApi } from '@/api/adoption-api';
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyApplicationsView } from '@/components/adoption/MyApplicationsView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { createLogger } from '@/lib/logger';
import { ClipboardText, Heart, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { MotionView, Presence } from '@petspark/motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { VirtualGrid } from '@/components/virtual/VirtualGrid';

// Type definition for global spark object
declare global {
   
  var spark: {
    user: () => Promise<{ id: string }>;
  } | undefined;
}

const logger = createLogger('AdoptionView');

type ViewMode = 'browse' | 'my-applications' | 'my-listings';

export default function AdoptionView() {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useStorage<string[]>('adoption-favorites', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'favorites'>('all');
  const [userApplicationsCount, setUserApplicationsCount] = useState(0);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [_cursor, setCursor] = useState<string | undefined>();

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      // If spark.user is a global, it remains; otherwise inject from context.
      if (typeof spark !== 'undefined') {
        await spark.user();
      }
      const result = await adoptionApi.getAdoptionProfiles({ limit: 50 });
      const mappedListings = result.profiles.map(
        (p) =>
          (({
            id: p._id,
            ownerId: p.shelterId,
            ownerName: p.shelterName,
            petId: p.petId,
            petName: p.petName,
            petBreed: p.breed,
            petAge: p.age,
            petGender: p.gender,
            petSize: p.size,
            petSpecies: 'dog' as const,
            petPhotos: p.photos,
            petDescription: p.description,

            status:
              p.status === 'available'
                ? ('active' as const)
                : p.status === 'pending'
                  ? ('pending_review' as const)
                  : p.status === 'adopted'
                    ? ('adopted' as const)
                    : ('pending_review' as const),

            location: {
              city: p.location.split(', ')[0] || '',
              country: p.location.split(', ')[1] || '',
              privacyRadiusM: 1000,
            },

            requirements: [],
            vetDocuments: [],
            vaccinated: p.vaccinated,
            spayedNeutered: p.spayedNeutered,
            microchipped: false,
            goodWithKids: p.goodWithKids,
            goodWithPets: p.goodWithPets,
            energyLevel: p.energyLevel,
            temperament: p.personality,
            reasonForAdoption: p.description || 'Looking for a loving home',
            createdAt: p.postedDate,
            updatedAt: p.postedDate,
            viewsCount: 0,
            applicationsCount: 0,
            featured: false
          }) as AdoptionListing),
      );
      setListings(mappedListings);
      setCursor(result.nextCursor);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load listings', err, { action: 'loadListings' });
      toast.error('Failed to load adoption listings');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserApplicationsCount = useCallback(async () => {
    try {
      if (typeof spark === 'undefined') {
        return;
      }
      const user = await spark.user();
      const applications = await adoptionApi.getUserApplications(user.id);
      setUserApplicationsCount(applications.length);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load user applications count', err, {
        action: 'loadUserApplicationsCount',
      });
    }
  }, []);

  useEffect(() => {
    void loadListings();
    void loadUserApplicationsCount();
  }, [loadListings, loadUserApplicationsCount]);

  const handleToggleFavorite = useCallback(
    (listingId: string) => {
      setFavorites((currentFavorites) => {
        const current = Array.isArray(currentFavorites) ? currentFavorites : [];
        if (current.includes(listingId)) return current.filter((id) => id !== listingId);
        return [...current, listingId];
      });
    },
    [setFavorites],
  );

  const handleSelectListing = useCallback((listing: AdoptionListing) => {
    setSelectedListing(listing);
    setShowDetailDialog(true);
  }, []);

  const renderListingCard = useCallback(
    (listing: AdoptionListing) => (
      <AdoptionListingCard
        listing={listing}
        onSelect={handleSelectListing}
        onFavorite={handleToggleFavorite}
        isFavorited={Array.isArray(favorites) && favorites.includes(listing.id)}
      />
    ),
    [favorites, handleSelectListing, handleToggleFavorite],
  );

  const listingKeyExtractor = useCallback((listing: AdoptionListing) => listing.id, []);

  const filteredListings = useMemo(() => {
    let list = listings.filter((l) => l.status === 'active');

    if (activeTab === 'available') {
      list = list.filter((l) => l.status === 'active');
    } else if (activeTab === 'favorites') {
      list = list.filter((l) => Array.isArray(favorites) && favorites.includes(l.id));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.petName.toLowerCase().includes(q) ||
          l.petBreed.toLowerCase().includes(q) ||
          l.location.city.toLowerCase().includes(q) ||
          l.location.country.toLowerCase().includes(q),
      );
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [listings, activeTab, favorites, searchQuery]);

  if (viewMode === 'my-applications') {
    return <MyApplicationsView onBack={() => setViewMode('browse')} />;
  }

  const availableCount = listings.filter((l) => l.status === 'active').length;

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransitionWrapper key="adoption-view" direction="up">
      <main role="main" aria-label="Pet adoption section">
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Heart size={32} weight="fill" className="text-primary" aria-hidden="true" />
                {t.adoption?.title || 'Pet Adoption'}
              </h1>
              <p className="text-muted-foreground">
                {t.adoption?.subtitle || 'Find your perfect companion and give them a forever home'}
              </p>
            </div>

            <nav className="flex items-center gap-2" aria-label="Adoption actions">
              <Button onClick={() => setViewMode('my-applications')} variant="outline" className="gap-2">
                <ClipboardText size={20} weight="fill" />
                {t.adoption?.myApplications || 'My Applications'}
                {userApplicationsCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {userApplicationsCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus size={20} weight="fill" />
                {t.adoption?.createListing || 'Create Listing'}
              </Button>
            </nav>
          </header>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 relative w-full">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder={'Search by pet name, breed, location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search adoption listings"
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="all">All {listings.length > 0 && `(${listings.length})`}</TabsTrigger>
                <TabsTrigger value="available">
                  {t.adoption?.available || 'Available'} {availableCount > 0 && `(${availableCount})`}
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  Favorites {Array.isArray(favorites) && favorites.length > 0 && `(${favorites.length})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[calc(100vh-320px)]">
            <Presence visible={!loading}>
              {!loading && (
                <MotionView
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {filteredListings.length === 0 ? (
                    <MotionView key="empty" className="flex flex-col items-center justify-center py-16">
                      <Heart size={64} className="text-muted-foreground mb-4" weight="thin" />
                      <h3 className="text-lg font-semibold mb-2">
                        {activeTab === 'favorites'
                          ? 'No Favorites Yet'
                          : searchQuery
                            ? 'No Results Found'
                            : 'No Pets Available'}
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        {activeTab === 'favorites'
                          ? 'Start adding pets to your favorites to see them here.'
                          : searchQuery
                            ? 'Try adjusting your search terms or filters.'
                            : 'Check back soon for new pets looking for their forever homes.'}
                      </p>
                    </MotionView>
                  ) : (
                    <VirtualGrid
                      items={filteredListings}
                      renderItem={renderListingCard}
                      columns={3}
                      itemHeight={400}
                      gap={24}
                      overscan={5}
                      containerClassName="h-full"
                      keyExtractor={listingKeyExtractor}
                    />
                  )}
                </MotionView>
              )}
            </Presence>
          </div>

          <CreateAdoptionListingDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={() => {
              void loadListings();
              void loadUserApplicationsCount();
            }}
          />

          <AdoptionListingDetailDialog
            listing={selectedListing}
            open={showDetailDialog}
            onOpenChange={(open) => {
              setShowDetailDialog(open);
              if (!open) setSelectedListing(null);
              void loadUserApplicationsCount();
            }}
            onApplicationSubmitted={() => {
              void loadUserApplicationsCount();
            }}
          />
        </div>
      </main>
    </PageTransitionWrapper>
  );
}
