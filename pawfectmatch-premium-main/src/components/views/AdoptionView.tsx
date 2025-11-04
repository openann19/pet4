import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Heart, ClipboardText, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard'
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog'
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog'
import { MyApplicationsView } from '@/components/adoption/MyApplicationsView'
import { adoptionAPI } from '@/api/adoption-api'
import { useApp } from '@/contexts/AppContext'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AdoptionView')

type ViewMode = 'browse' | 'my-applications' | 'my-listings'

export default function AdoptionView() {
  const { t } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('browse')
  const [listings, setListings] = useState<AdoptionListing[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useStorage<string[]>('adoption-favorites', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'favorites'>('all')
  const [userApplicationsCount, setUserApplicationsCount] = useState(0)
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()

  useEffect(() => {
    loadListings()
    loadUserApplicationsCount()
  }, [])

  const loadListings = async () => {
    try {
      setLoading(true)
      await spark.user()
      const result = await adoptionAPI.queryListings({
        limit: 50,
        cursor: cursor
      })
      setListings(result.listings)
      setCursor(result.nextCursor)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load listings', err, { action: 'loadListings' })
      toast.error('Failed to load adoption listings')
    } finally {
      setLoading(false)
    }
  }

  const loadUserApplicationsCount = async () => {
    try {
      const user = await spark.user()
      const applications = await adoptionAPI.queryApplications(user.id)
      setUserApplicationsCount(applications.length)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load user applications count', err, { action: 'loadUserApplicationsCount' })
    }
  }

  const handleToggleFavorite = (listingId: string) => {
    setFavorites((currentFavorites) => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : []
      if (current.includes(listingId)) {
        return current.filter(id => id !== listingId)
      } else {
        return [...current, listingId]
      }
    })
  }

  const handleSelectListing = (listing: AdoptionListing) => {
    setSelectedListing(listing)
    setShowDetailDialog(true)
  }

  const filteredListings = () => {
    let list = listings.filter(l => l.status === 'active')

    if (activeTab === 'available') {
      list = list.filter(l => l.status === 'active')
    } else if (activeTab === 'favorites') {
      list = list.filter(l => Array.isArray(favorites) && favorites.includes(l.id))
    }

    if (searchQuery) {
      list = list.filter(l =>
        l.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.petBreed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.location.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  if (viewMode === 'my-applications') {
    return <MyApplicationsView onBack={() => setViewMode('browse')} />
  }

  const availableCount = listings.filter(l => l.status === 'active').length

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Heart size={32} weight="fill" className="text-primary" />
            {t.adoption?.title || 'Pet Adoption'}
          </h2>
          <p className="text-muted-foreground">
            {t.adoption?.subtitle || 'Find your perfect companion and give them a forever home'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('my-applications')}
            variant="outline"
            className="gap-2"
          >
            <ClipboardText size={20} weight="fill" />
            {t.adoption?.myApplications || 'My Applications'}
            {userApplicationsCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {userApplicationsCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus size={20} weight="fill" />
            {t.adoption?.createListing || 'Create Listing'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 relative w-full">
          <MagnifyingGlass 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            size={20} 
          />
          <Input
            placeholder={"Search by pet name, breed, location..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">
              All {listings.length > 0 && `(${listings.length})`}
            </TabsTrigger>
            <TabsTrigger value="available">
              {t.adoption?.available || 'Available'} {availableCount > 0 && `(${availableCount})`}
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites {Array.isArray(favorites) && favorites.length > 0 && `(${favorites.length})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <AnimatePresence mode="wait">
          {filteredListings().length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Heart size={64} className="text-muted-foreground mb-4" weight="thin" />
              <h3 className="text-xl font-semibold mb-2">
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
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"
            >
              {filteredListings().map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AdoptionListingCard
                    listing={listing}
                    onSelect={handleSelectListing}
                    onFavorite={handleToggleFavorite}
                    isFavorited={Array.isArray(favorites) && favorites.includes(listing.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <CreateAdoptionListingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadListings()
          loadUserApplicationsCount()
        }}
      />

      <AdoptionListingDetailDialog
        listing={selectedListing}
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open)
          if (!open) {
            setSelectedListing(null)
          }
          loadUserApplicationsCount()
        }}
        onApplicationSubmitted={() => {
          loadUserApplicationsCount()
        }}
      />
    </div>
  )
}
