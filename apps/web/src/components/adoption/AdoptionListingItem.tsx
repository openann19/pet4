// apps/web/src/components/adoption/AdoptionListingItem.tsx
'use client';

import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { MotionView } from '@petspark/motion';
import { AdoptionListingCard } from './AdoptionListingCard';

export interface AdoptionListingItemProps {
    listing: AdoptionListing;
    index: number;
    onSelect: () => void;
}

/**
 * Single card with premium entry/exit animation.
 * Uses layout animations so the grid reflows smoothly when filters change.
 */
export function AdoptionListingItem({ listing, index, onSelect }: AdoptionListingItemProps) {
    return (
        <MotionView
            layout
            key={listing.id}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{
                delay: index * 0.04,
                duration: 0.35,
                ease: [0.22, 0.61, 0.36, 1],
            }}
            className="will-change-transform"
        >
            <AdoptionListingCard listing={listing} onSelect={onSelect} />
        </MotionView>
    );
}
