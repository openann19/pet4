import { AdoptionFiltersSheet } from '@/components/adoption/AdoptionFiltersSheet';
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyAdoptionApplications } from '@/components/adoption/MyAdoptionApplications';
import { MyAdoptionListings } from '@/components/adoption/MyAdoptionListings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adoptionMarketplaceService } from '@/lib/adoption-marketplace-service';
import type { AdoptionListing, AdoptionListingFilters } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';
import { logger } from '@/lib/logger';
import { Check, Funnel, Heart, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type ViewTab = 'browse' | 'my-listings' | 'my-applications';

export default function AdoptionMarketplaceView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('browse');
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdoptionListingFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await spark.user();
      setCurrentUser({ id: user.id, name: user.login });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load user', err, { action: 'loadUser' });
    }
  }, []);

  const loadListings = useCallback(
    async (_reset = true) => {
      try {
        setLoading(true);
        const response = await adoptionMarketplaceService.getActiveListings(filters);
        setListings(response);
        setHasMore(false);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load listings', err, { action: 'loadListings' });
        toast.error('Failed to load adoption listings');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void loadCurrentUser();
    void loadListings();
  }, [loadCurrentUser, loadListings]);

  const handleCreateListing = () => {
    haptics.impact('medium');
    setShowCreateDialog(true);
  };

  const handleListingCreated = useCallback(() => {
    setShowCreateDialog(false);
    toast.success('Adoption listing created! It will be reviewed by our team.');
    void loadListings();
  }, [loadListings]);

  const handleSelectListing = (listing: AdoptionListing) => {
    haptics.impact('light');
    setSelectedListing(listing);
    setShowDetailDialog(true);
  };

  const handleToggleFilters = () => {
    haptics.impact('light');
    setShowFilters(!showFilters);
  };

  const filteredListings = searchQuery
    ? listings.filter(
      (listing) =>
        listing.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.petBreed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : listings;

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof AdoptionListingFilters];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  return (
    <PageTransitionWrapper key="adoption-marketplace-view" direction="up">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Heart size={32} weight="fill" className="text-primary" />
              Adoption Marketplace
            </h2>
            <p className="text-muted-foreground mt-1">
              Find your perfect companion and give them a loving forever home
            </p>
          </div>

          <Button onClick={handleCreateListing} className="gap-2">
            <Plus size={20} weight="bold" />
            List Pet
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="browse" className="flex-1 sm:flex-none">
              Browse
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="flex-1 sm:flex-none">
              My Listings
            </TabsTrigger>
            <TabsTrigger value="my-applications" className="flex-1 sm:flex-none">
              Applications
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4 mt-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <Input
                  placeholder="Search by name, breed, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={handleToggleFilters} className="gap-2 relative">
                <Funnel size={20} />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.breed &&
                  filters.breed.length > 0 &&
                  filters.breed.map((breed) => (
                    <Badge key={breed} variant="secondary" className="gap-1">
                      {breed}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => {
                          setFilters((prev) => {
                            const newBreed = prev.breed?.filter((b: string) => b !== breed);
                            const updated = { ...prev };
                            if (!newBreed || newBreed.length === 0) {
                              delete updated.breed;
                            } else {
                              updated.breed = newBreed;
                            }
                            return updated;
                          });
                        }}
                      />
                    </Badge>
                  ))}
                {filters.vaccinated && (
                  <Badge variant="secondary" className="gap-1">
                    <Check size={14} /> Vaccinated
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => {
                        setFilters((prev) => {
                          const updated = { ...prev };
                          delete updated.vaccinated;
                          return updated;
                        });
                      }}
                    />
                  </Badge>
                )}
                {filters.spayedNeutered && (
                  <Badge variant="secondary" className="gap-1">
                    <Check size={14} /> Spayed/Neutered
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => {
                        setFilters((prev) => {
                          const updated = { ...prev };
                          delete updated.spayedNeutered;
                          return updated;
                        });
                      }}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Listings Grid */}
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <Heart size={64} className="text-muted-foreground mb-4" weight="thin" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'No results found' : 'No pets available'}
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Check back soon for new pets looking for their forever homes'}
                </p>
              </MotionView>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                  {filteredListings.map((listing, index) => (
                    <MotionView
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AdoptionListingCard
                        listing={listing}
                        onSelect={() => handleSelectListing(listing)}
                      />
                    </MotionView>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => loadListings(false)} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="my-listings">
            {currentUser && <MyAdoptionListings userId={currentUser.id} />}
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="my-applications">
            {currentUser && <MyAdoptionApplications userId={currentUser.id} />}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateAdoptionListingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleListingCreated}
        />

        <AdoptionListingDetailDialog
          listing={selectedListing}
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open);
            if (!open) setSelectedListing(null);
          }}
          onApplicationSubmitted={() => {
            loadListings();
            toast.success('Application submitted successfully!');
          }}
        />

        <AdoptionFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </PageTransitionWrapper>
  );
}
