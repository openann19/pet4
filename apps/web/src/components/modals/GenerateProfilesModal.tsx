import { MotionView } from "@petspark/motion";
/**
 * GenerateProfilesModal Component
 *
 * Modal for generating profile data.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/LoadingState';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import GenerateProfilesButton from '@/components/GenerateProfilesButton';

interface GenerateProfilesModalProps {
    isVisible: boolean;
    animations: UseAppAnimationsReturn;
    onClose: () => void;
}

export function GenerateProfilesModal({
    isVisible,
    animations,
    onClose,
}: GenerateProfilesModalProps): JSX.Element | null {
    if (!isVisible) return null;

    const { generateProfilesModal, generateProfilesContent, closeButtonBounce } = animations;

    return (
        <MotionView
            style={generateProfilesModal.style}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => void onClose()}
        >
            <MotionView
                style={generateProfilesContent.style}
                onClick={(e?: React.MouseEvent<Element>) => e?.stopPropagation()}
                className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
            >
                <Suspense fallback={<LoadingState />}>
                    <GenerateProfilesButton />
                </Suspense>
                <MotionView style={closeButtonBounce.animatedStyle}>
                    <Button variant="outline" className="w-full mt-4" onClick={() => void onClose()}>
                        Close
                    </Button>
                </MotionView>
            </MotionView>
        </MotionView>
    );
}
