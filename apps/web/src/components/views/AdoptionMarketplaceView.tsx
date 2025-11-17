'use client';

import { useState } from 'react';
import { AdoptionFiltersSheet } from '@/components/adoption/AdoptionFiltersSheet';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyAdoptionApplications } from '@/components/adoption/MyAdoptionApplications';
import { MyAdoptionListings } from '@/components/adoption/MyAdoptionListings';
import { AdoptionListingItem } from '@/components/adoption/AdoptionListingItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SegmentedControl } from '@/components/enhanced/buttons/SegmentedControl';
import { Card } from '@/components/ui/card';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses } from '@/lib/typography';
import { Check, Funnel, Heart, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useAdoptionMarketplace } from '@/hooks/adoption/use-adoption-marketplace';
import { toast } from 'sonner';

type ViewTab = 'browse' | 'my-listings' | 'my-applications';

export default function AdoptionMarketplaceView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const {
    listings,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    currentUser,
    hasMore,
    loadListings,
    filteredListings,
    activeFilterCount,
  } = useAdoptionMarketplace();

  const handleCreateListing = () => {
    haptics.impact('medium');
    setShowCreateDialog(true);
  };

  const handleListingCreated = () => {
    setShowCreateDialog(false);
    toast.success('Adoption listing created! It will be reviewed by our team.');
    void loadListings();
  };

  const handleSelectListing = (listing: AdoptionListing) => {
    haptics.impact('light');
    setSelectedListing(listing);
    setShowDetailDialog(true);
  };

  const handleToggleFilters = () => {
    haptics.impact('light');
    setShowFilters((prev) => !prev);
  };

  return (
    <PageTransitionWrapper key="adoption-marketplace-view" direction="up">
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className={`flex items-center gap-3 ${getTypographyClasses('h1')}`}>                                                                            
              <Heart size={36} weight="fill" className="text-primary" />
              Adoption Marketplace
            </h1>
            <p className={`text-muted-foreground ${getTypographyClasses('body')}`}>                                                                     
              Find your perfect companion and give them a loving forever home
            </p>
          </div>

          <Button 
            onClick={handleCreateListing} 
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl transition-all" 
            type="button"
          >
            <Plus size={20} weight="bold" />
            List Pet
          </Button>
        </div>

        {/* Mode Switching */}
        <SegmentedControl
          aria-label="Adoption marketplace view mode"
          options={[
            { label: 'Browse', value: 'browse' },
            { label: 'My Listings', value: 'my-listings' },
            { label: 'Applications', value: 'my-applications' },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as ViewTab)}
          className="w-full sm:w-auto"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
          <div className="hidden">
            <TabsList>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="my-listings">My Listings</TabsTrigger>
              <TabsTrigger value="my-applications">Applications</TabsTrigger>
            </TabsList>
          </div>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-6 space-y-4">
            {/* Premium Search + Filters Control Strip - iMessage/Telegram X Style */}
            <Card className="p-5 bg-background/80 backdrop-blur-xl border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">                                                                           
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 group">
                  <MagnifyingGlass
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200"                                                                  
                    size={20}
                  />
                  <Input
                    placeholder="Search by name, breed, or location..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-12 text-base border-border/60 bg-background/90 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 rounded-xl"                                                   
                  />
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleFilters}
                  className="relative gap-2 bg-background/90 hover:bg-background border-border/50 hover:border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-sm hover:shadow-md"                            
                  type="button"
                >
                  <Funnel size={20} weight="bold" />
                  <span className="font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-primary/20">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </Card>

            {/* Active Filters - Premium Style */}
            {activeFilterCount > 0 && (
              <MotionView
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Card className="p-4 bg-background/60 backdrop-blur-md border-border/40 shadow-md rounded-xl">
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className={`${getTypographyClasses('body')} text-muted-foreground font-medium`}>                                                   
                      Active filters:
                    </span>
                    
                    {filters.breed &&
                      filters.breed.length > 0 &&
                      filters.breed.map((breed) => (
                        <MotionView
                          key={breed}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                            {breed}
                            <X
                              size={12}
                              className="cursor-pointer hover:text-destructive transition-colors"
                              onClick={() => {
                                const newBreed = filters.breed?.filter((b: string) => b !== breed);
                                if (!newBreed || newBreed.length === 0) {
                                  const { breed: _, ...nextFilters } = filters;
                                  setFilters(nextFilters);
                                } else {
                                  setFilters({ ...filters, breed: newBreed });
                                }
                              }}
                            />
                          </Badge>
                        </MotionView>
                      ))}

                    {filters.vaccinated && (
                      <MotionView
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20 hover:bg-success/15 transition-colors">
                          <Check size={12} /> Vaccinated
                          <X
                            size={12}
                            className="cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => {
                              const { vaccinated: _, ...nextFilters } = filters;
                              setFilters(nextFilters);
                            }}
                          />
                        </Badge>
                      </MotionView>
                    )}

                    {filters.spayedNeutered && (
                      <MotionView
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="secondary" className="gap-1 bg-info/10 text-info border-info/20 hover:bg-info/15 transition-colors">
                          <Check size={12} /> Fixed
                          <X
                            size={12}
                            className="cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => {
                              const { spayedNeutered: _, ...nextFilters } = filters;
                              setFilters(nextFilters);
                            }}
                          />
                        </Badge>
                      </MotionView>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        haptics.impact('light');
                        setFilters({});
                      }}
                      className="h-8 px-4 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg font-medium"                          
                    >
                      Clear All
                    </Button>
                  </div>
                </Card>
              </MotionView>
            )}

            {/* Listings */}
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={`skeleton-${i}`} className="h-96 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="flex flex-col items-center justify-center py-20 text-center"                                                                         
              >
                <MotionView
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
                >
                  <Heart size={72} className="mb-6 text-muted-foreground/50" weight="thin" />                                                                   
                </MotionView>
                <h3 className={`mb-4 ${getTypographyClasses('h2')}`}>
                  {searchQuery ? 'No results found' : 'No pets available'}
                </h3>
                <p className={`max-w-md ${getTypographyClasses('body')} text-muted-foreground mb-6`}>                                                             
                  {searchQuery
                    ? 'Try adjusting your search or filters to find more companions'                                                                            
                    : 'Check back soon for new pets looking for their forever homes.'}                                                                          
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      haptics.impact('light');
                      setSearchQuery('');
                      setFilters({});
                    }}
                    className="mt-2 rounded-xl"
                  >
                    Clear Search & Filters
                  </Button>
                )}
              </MotionView>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredListings.map((listing, index) => (
                    <AdoptionListingItem
                      key={listing.id}
                      listing={listing}
                      index={index}
                      onSelect={() => handleSelectListing(listing)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void loadListings(false)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Listings */}
          <TabsContent value="my-listings">
            {currentUser && <MyAdoptionListings userId={currentUser.id} />}
          </TabsContent>

          {/* My Applications */}
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
            // fix: no-floating-promises → explicitly mark we ignore the Promise
            void loadListings();
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
