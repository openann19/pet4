import { MotionView } from "@petspark/motion";
/**
 * MapModal Component
 *
 * Modal for displaying playdate map.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import LoadingState from '@/components/LoadingState';
import PlaydateMap from '@/components/playdate/PlaydateMap';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import type { Playdate } from '@/lib/playdate-types';

interface MapModalProps {
    isVisible: boolean;
    playdates: Playdate[];
    animations: UseAppAnimationsReturn;
    onClose: () => void;
}

export function MapModal({
    isVisible,
    playdates,
    animations,
    onClose,
}: MapModalProps): JSX.Element | null {
    if (!isVisible) return null;

    const { mapModal, mapContent } = animations;

    return (
        <MotionView style={mapModal.style} className="fixed inset-0 z-50">
            <Suspense fallback={<LoadingState />}>
                <MotionView style={mapContent.style} className="h-full w-full">
                    <PlaydateMap playdates={playdates} onClose={onClose} />
                </MotionView>
            </Suspense>
        </MotionView>
    );
}
