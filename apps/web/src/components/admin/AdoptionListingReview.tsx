'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Check, X, Eye, Clock, PawPrint } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { adoptionMarketplaceService } from '@/lib/adoption-marketplace-service'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'
import { createLogger } from '@/lib/logger'
import { userService } from '@/lib/user-service'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('AdoptionListingReview')

interface ListingItemProps {
  listing: AdoptionListing
  isSelected: boolean
  onSelect: () => void
  animation: ReturnType<typeof useBounceOnTap>
}

interface ListingItemWrapperProps {
  listing: AdoptionListing
  isSelected: boolean
  onSelect: () => void
}

function ListingItemWrapper({ listing, isSelected, onSelect }: ListingItemWrapperProps) {
  const bounceAnimation = useBounceOnTap({
    scale: 0.98,
    hapticFeedback: true
  })

  return (
    <ListingItem
      listing={listing}
      isSelected={isSelected}
      onSelect={onSelect}
      animation={bounceAnimation}
    />
  )
}

function ListingItem({ listing, isSelected, onSelect, animation }: ListingItemProps) {
  const handleClick = useCallback(() => {
    animation.handlePress()
    onSelect()
  }, [animation, onSelect])

  return (
    <AnimatedView
      style={animation.animatedStyle}
      onClick={handleClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
        String(isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50' ?? '')
      }`}
    >
      <div className="flex items-start gap-3">
        {listing.petPhotos[0] && (
          <img
            src={listing.petPhotos[0]}
            alt={listing.petName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">{listing.petName}</h4>
          <p className="text-sm text-muted-foreground">
            {listing.petBreed} • {listing.petAge} years
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            by {listing.ownerName}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(listing.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </AnimatedView>
  )
}

export function AdoptionListingReview() {
  const [pendingListings, setPendingListings] = useState<AdoptionListing[]>([])
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadPendingListings = useCallback(async () => {
    try {
      const listings = await adoptionMarketplaceService.getPendingListings()
      setPendingListings(listings)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load pending listings', err, { action: 'loadPendingListings' })
      toast.error('Failed to load listings')
    }
  }, [])

  useEffect(() => {
    void loadPendingListings()
  }, [loadPendingListings])

  const handleApprove = useCallback(async (listingId: string) => {
    try {
      setIsProcessing(true)
      const user = await userService.user()
      if (!user) {
        throw new Error('User context unavailable')
      }
      await adoptionMarketplaceService.updateListingStatus(listingId, 'active', user.id)
      toast.success('Listing approved')
      await loadPendingListings()
      setSelectedListing(null)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to approve listing', err, { listingId, action: 'approve' })
      toast.error('Failed to approve listing')
    } finally {
      setIsProcessing(false)
    }
  }, [loadPendingListings])

  const handleReject = useCallback(async (listingId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setIsProcessing(true)
      const user = await userService.user()
      if (!user) {
        throw new Error('User context unavailable')
      }
      await adoptionMarketplaceService.updateListingStatus(listingId, 'withdrawn', user.id, rejectionReason)
      toast.success('Listing rejected')
      await loadPendingListings()
      setSelectedListing(null)
      setRejectionReason('')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to reject listing', err, { listingId, action: 'reject', hasReason: !!rejectionReason.trim() })
      toast.error('Failed to reject listing')
    } finally {
      setIsProcessing(false)
    }
  }, [rejectionReason, loadPendingListings])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Adoption Listing Review</h2>
        <p className="text-muted-foreground mt-1">
          Review and approve adoption listings before they go live
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              Pending Review ({pendingListings.length})
            </CardTitle>
            <CardDescription>Click to review listing details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {pendingListings.length === 0 ? (
                  <div className="text-center py-12">
                    <PawPrint size={48} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No pending listings</p>
                  </div>
                ) : (
                  pendingListings.map(listing => (
                    <ListingItemWrapper
                      key={listing.id}
                      listing={listing}
                      isSelected={selectedListing?.id === listing.id}
                      onSelect={() => { setSelectedListing(listing); }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Review Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedListing ? (
              <div className="text-center py-24">
                <Eye size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a listing to review</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedListing.ownerAvatar} />
                      <AvatarFallback>{selectedListing.ownerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedListing.petName}</h3>
                      <p className="text-muted-foreground">Listed by {selectedListing.ownerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedListing.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedListing.petPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedListing.petPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${String(selectedListing.petName ?? '')} ${String(index + 1 ?? '')}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Species</p>
                      <p className="font-medium capitalize">{selectedListing.petSpecies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Breed</p>
                      <p className="font-medium">{selectedListing.petBreed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{selectedListing.petAge} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{selectedListing.petGender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium capitalize">{selectedListing.petSize}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Energy Level</p>
                      <p className="font-medium capitalize">{selectedListing.energyLevel}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{selectedListing.petDescription}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Temperament</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.temperament.map(trait => (
                        <Badge key={trait} variant="secondary">{trait}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Health Status</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.vaccinated && <Badge variant="outline">Vaccinated</Badge>}
                      {selectedListing.spayedNeutered && <Badge variant="outline">Spayed/Neutered</Badge>}
                      {selectedListing.microchipped && <Badge variant="outline">Microchipped</Badge>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Good With</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.goodWithKids && <Badge variant="outline">Children</Badge>}
                      {selectedListing.goodWithPets && <Badge variant="outline">Other Pets</Badge>}
                      {selectedListing.goodWithDogs && <Badge variant="outline">Dogs</Badge>}
                      {selectedListing.goodWithCats && <Badge variant="outline">Cats</Badge>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Location</p>
                    <p className="text-sm font-medium">
                      {selectedListing.location.city}, {selectedListing.location.country}
                    </p>
                  </div>

                  {selectedListing.requirements.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Requirements</p>
                      <ul className="text-sm space-y-1">
                        {selectedListing.requirements.map((req, index) => (
                          <li key={index}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedListing.fee && selectedListing.fee.amount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Adoption Fee</p>
                      <p className="text-lg font-semibold">
                        {selectedListing.fee.currency} {selectedListing.fee.amount}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Reason for Adoption</p>
                    <p className="text-sm">{selectedListing.reasonForAdoption}</p>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => { setRejectionReason(e.target.value); }}
                        placeholder="Explain why this listing is being rejected..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (isTruthy(selectedListing)) {
                            void handleReject(selectedListing.id)
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                        disabled={isProcessing || !selectedListing}
                      >
                        <X size={18} className="mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          if (isTruthy(selectedListing)) {
                            void handleApprove(selectedListing.id)
                          }
                        }}
                        className="flex-1"
                        disabled={isProcessing || !selectedListing}
                      >
                        <Check size={18} className="mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
