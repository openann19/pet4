/**
 * MatchConfettiTrigger Component (Web)
 *
 * Listens for match-confetti-trigger events and renders ConfettiBurst.
 * This component should be placed at the app root level to handle confetti celebrations.
 *
 * Location: apps/web/src/components/chat/MatchConfettiTrigger.tsx
 */

import { useEffect, useState, useCallback, memo } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { createLogger } from '@/lib/logger';

const logger = createLogger('match-confetti-trigger');

/**
 * Event detail from useMatchConfetti hook
 */
interface MatchConfettiEventDetail {
    particleCount: number;
    colors: string[];
    duration: number;
    seed: string;
}

/**
 * Internal confetti state
 */
interface ConfettiState {
    enabled: boolean;
    particleCount: number;
    colors: string[];
    duration: number;
    seed: string;
    key: number; // Force re-render on new trigger
}

const DEFAULT_STATE: ConfettiState = {
    enabled: false,
    particleCount: 80,
    colors: ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899'],
    duration: 1400,
    seed: 'confetti',
    key: 0,
};

/**
 * MatchConfettiTrigger Component
 *
 * Place this component at the root of your app to enable match confetti celebrations.
 *
 * @example
 * ```tsx
 * // In App.tsx or similar
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <MatchConfettiTrigger />
 *     </>
 *   )
 * }
 * ```
 */
export const MatchConfettiTrigger = memo(() => {
    const [confettiState, setConfettiState] = useState<ConfettiState>(DEFAULT_STATE);

    const handleMatchConfetti = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<MatchConfettiEventDetail>;
        const { particleCount, colors, duration, seed } = customEvent.detail;

        logger.debug('Match confetti event received', {
            particleCount,
            colors,
            duration,
            seed,
        });

        setConfettiState((prev) => ({
            enabled: true,
            particleCount,
            colors,
            duration,
            seed,
            key: prev.key + 1, // Increment key to force re-render
        }));
    }, []);

    const handleComplete = useCallback(() => {
        logger.debug('Confetti complete, resetting state');
        setConfettiState((prev) => ({
            ...DEFAULT_STATE,
            key: prev.key, // Keep the same key
        }));
    }, []);

    useEffect(() => {
        window.addEventListener('match-confetti-trigger', handleMatchConfetti);

        return () => {
            window.removeEventListener('match-confetti-trigger', handleMatchConfetti);
        };
    }, [handleMatchConfetti]);

    if (!confettiState.enabled) {
        return null;
    }

    return (
        <ConfettiBurst
            key={confettiState.key}
            enabled={confettiState.enabled}
            particleCount={confettiState.particleCount}
            colors={confettiState.colors}
            duration={confettiState.duration}
            seed={confettiState.seed}
            onComplete={handleComplete}
            className="z-9999"
        />
    );
});

MatchConfettiTrigger.displayName = 'MatchConfettiTrigger';
