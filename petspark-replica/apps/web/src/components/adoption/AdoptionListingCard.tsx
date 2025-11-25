/**
 * AdoptionListingCard Component for Web
 *
 * Web adaptation of mobile AdoptionListingCard with core functionality:
 * - Pet image display with fallback
 * - Pet information display
 * - Favorite button functionality
 * - Premium badges and status indicators
 * - Contact and view actions
 * - Responsive design with animations
 */

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heart, MapPin, Shield, Star, MessageCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@petspark/shared';
import type { AdoptionListing } from '@petspark/shared';

export interface AdoptionListingCardProps {
    readonly listing: AdoptionListing;
    readonly onPress: (listing: AdoptionListing) => void;
    readonly onFavoritePress: (listing: AdoptionListing) => void;
    readonly onContactPress: (listing: AdoptionListing) => void;
    readonly isFavorited: boolean;
    readonly showDistance?: boolean;
    readonly className?: string;
}

export function AdoptionListingCard({
    listing,
    onPress,
    onFavoritePress,
    onContactPress,
    isFavorited,
    showDistance = false,
    className
}: AdoptionListingCardProps) {
    const {
        petName,
        petBreed,
        petAge,
        petGender,
        petSize,
        petPhotos,
        petDescription,
        status,
        fee,
        location,
        vaccinated,
        spayedNeutered,
        microchipped,
        goodWithKids,
        goodWithPets,
        energyLevel,
        temperament: _temperament,
        featured,
        distance
    } = listing;

    const isActive = status === 'active';
    const isAdopted = status === 'adopted';
    const hasFee = fee && fee.amount > 0;

    const handleCardPress = () => {
        if (isActive) {
            onPress(listing);
        }
    };

    const handleFavoritePress = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFavoritePress(listing);
    };

    const handleContactPress = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActive) {
            onContactPress(listing);
        }
    };

    return (
        <motion.div
            className={cn(
                "group cursor-pointer transition-all duration-200 hover:shadow-lg",
                !isActive && "opacity-75 cursor-not-allowed",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2 }}
            onClick={handleCardPress}
        >
            <Card className="overflow-hidden">
                {/* Image Section */}
                <div className="relative h-48 bg-muted">
                    {petPhotos.length > 0 ? (
                        <img
                            src={petPhotos[0]}
                            alt={petName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to avatar on image error
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.appendChild(
                                    Object.assign(document.createElement('div'), {
                                        className: 'w-full h-full flex items-center justify-center bg-muted',
                                        innerHTML: `<div class="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center"><span class="text-2xl font-bold text-muted-foreground">${petName.charAt(0).toUpperCase()}</span></div>`
                                    })
                                );
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-muted-foreground">
                                    {petName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Status and Featured Badges */}
                    <div className="absolute top-2 left-2 flex gap-2">
                        {featured && (
                            <motion.div
                                className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Star className="w-3 h-3" />
                                Featured
                            </motion.div>
                        )}
                        {!isActive && (
                            <div className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full font-medium">
                                {isAdopted ? 'Adopted' : 'Pending'}
                            </div>
                        )}
                    </div>

                    {/* Favorite Button */}
                    <motion.button
                        className="absolute top-2 right-2 p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors"
                        onClick={handleFavoritePress}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Heart
                            className={cn(
                                "w-5 h-5",
                                isFavorited
                                    ? "fill-red-500 text-red-500"
                                    : "text-muted-foreground hover:text-red-500 transition-colors"
                            )}
                        />
                    </motion.button>

                    {/* Distance Badge */}
                    {showDistance && distance && (
                        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-muted-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {distance} km away
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <CardContent className="p-4 space-y-3">
                    {/* Pet Name and Basic Info */}
                    <div className="space-y-1">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                                {petName}
                            </h3>
                            {hasFee && (
                                <div className="text-sm font-medium text-primary">
                                    ${fee.amount}
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {petBreed} • {petAge} years • {petGender} • {petSize}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="w-3 h-3" />
                            {location.city}, {location.country}
                        </div>
                    </div>

                    {/* Health and Care Indicators */}
                    <div className="flex flex-wrap gap-2">
                        {vaccinated && (
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                <Shield className="w-3 h-3" />
                                Vaccinated
                            </div>
                        )}
                        {spayedNeutered && (
                            <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                <Shield className="w-3 h-3" />
                                Spayed/Neutered
                            </div>
                        )}
                        {microchipped && (
                            <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                <Shield className="w-3 h-3" />
                                Microchipped
                            </div>
                        )}
                    </div>

                    {/* Compatibility */}
                    <div className="flex flex-wrap gap-2">
                        {goodWithKids && (
                            <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Good with kids
                            </div>
                        )}
                        {goodWithPets && (
                            <div className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full">
                                Good with pets
                            </div>
                        )}
                        <div className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            {energyLevel} energy
                        </div>
                    </div>

                    {/* Description Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {petDescription}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={!isActive}
                            onClick={handleContactPress}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contact
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1"
                            disabled={!isActive}
                            onClick={handleCardPress}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
