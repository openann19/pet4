import { MotionView } from "@petspark/motion";
/**
 * ThemeSettingsModal Component
 *
 * Modal for theme settings.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LoadingState from '@/components/LoadingState';
import UltraThemeSettings from '@/components/settings/UltraThemeSettings';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

interface ThemeSettingsModalProps {
    isVisible: boolean;
    animations: UseAppAnimationsReturn;
    onClose: () => void;
}

export function ThemeSettingsModal({
    isVisible,
    animations,
    onClose,
}: ThemeSettingsModalProps): JSX.Element {
    const { themeContent } = animations;

    return (
        <Dialog open={isVisible} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
                <DialogTitle className="sr-only">Ultra Theme Settings</DialogTitle>
                <MotionView style={themeContent.style}>
                    <Suspense fallback={<LoadingState />}>
                        <UltraThemeSettings />
                    </Suspense>
                </MotionView>
            </DialogContent>
        </Dialog>
    );
}
