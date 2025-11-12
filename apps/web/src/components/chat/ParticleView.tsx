'use client';

import { useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view';
import type { Particle } from '@/effects/reanimated/particle-engine';

export interface ParticleViewProps {
    particle: Particle;
    className?: string;
}

/**
 * ParticleView component that renders a single particle with animated style
 * Uses useAnimatedStyle to create reactive styles from particle SharedValues
 */
export function ParticleView({ particle, className }: ParticleViewProps): React.JSX.Element {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute' as const,
            left: particle.x.value,
            top: particle.y.value,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.size / 2,
            opacity: particle.opacity.value,
            transform: [
                { translateX: particle.x.value },
                { translateY: particle.y.value },
                { scale: particle.scale.value },
                { rotate: `${particle.rotation.value}deg` },
            ],
            pointerEvents: 'none' as const,
            zIndex: 9999,
        };
    }) as AnimatedStyle;

    return (
        <AnimatedView style={animatedStyle} className={className}>
            <div />
        </AnimatedView>
    );
}
