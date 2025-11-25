/**
 * Presence Aurora Ring Component — Mobile (React Native)
 *
 * Animated aurora ring around avatar for presence indication.
 * Uses React Native Reanimated for smooth 60fps animations.
 * Respects reduced motion preferences.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Animated, useSharedValue, useAnimatedStyle, withTiming, withRepeat } from '@petspark/motion';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';

export interface PresenceAuroraRingProps {
    src?: string;
    alt?: string;
    fallback?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    size?: number;
    intensity?: number; // 0-1, default 0.8
    pulseRate?: number; // milliseconds per rotation, default 3600
    style?: ViewStyle;
}

/**
 * Get colors for status
 */
function getStatusColors(status: 'online' | 'away' | 'busy' | 'offline'): {
    start: string;
    middle: string;
    end: string;
} {
    switch (status) {
        case 'online':
            return {
                start: '#34d399', // emerald-400
                middle: '#22d3ee', // cyan-400
                end: 'var(--color-accent-secondary-9)', // blue-500
            };
        case 'away':
            return {
                start: '#fbbf24', // amber-400
                middle: '#fb923c', // orange-400
                end: '#fb7185', // rose-400
            };
        case 'busy':
            return {
                start: 'var(--color-error-9)', // rose-500
                middle: '#d946ef', // fuchsia-500
                end: '#6366f1', // indigo-500
            };
        default:
            return {
                start: '#9ca3af', // gray-400
                middle: '#6b7280', // gray-500
                end: '#4b5563', // gray-600
            };
    }
}


/**
 * Presence Aurora Ring — Mobile Implementation
 *
 * @example
 * ```tsx
 * <PresenceAuroraRing
 *   src="/avatar.jpg"
 *   status="online"
 *   size={40}
 *   intensity={0.8}
 * />
 * ```
 */
export function PresenceAuroraRing({
    src: _src,
    alt,
    fallback: _fallback,
    status = 'online',
    size = 40,
    intensity = 0.8,
    pulseRate = 3600,
    style,
}: PresenceAuroraRingProps): React.JSX.Element {
    const reduced = useReducedMotion();
    const rot = useSharedValue(0);
    const opacity = useSharedValue(status === 'offline' ? 0 : intensity);

    const dur = getReducedMotionDuration(pulseRate, reduced);
    const colors = getStatusColors(status);

    useMemo(() => {
        rot.value = 0;
        opacity.value = status === 'offline' ? 0 : intensity;

        if (!reduced && status !== 'offline') {
            rot.value = withRepeat(withTiming(360, { duration: dur }), -1, false);
            opacity.value = withRepeat(
                withTiming(intensity, { duration: dur / 2 }),
                -1,
                true
            );
        }
    }, [reduced, status, dur, rot, opacity, intensity]);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rot.value}deg` }],
        opacity: opacity.value,
    }));

    const ringRadius = size / 2 + 2;
    const ringWidth = 3;

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                },
                style,
            ]}
            accessibilityRole="image"
            accessibilityLabel={alt ?? `User avatar ${status}`}
        >
            {/* Avatar placeholder - replace with actual Avatar component */}
            <View
                style={[
                    styles.avatar,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                ]}
            >
                {/* Avatar image would go here */}
            </View>

            {status !== 'offline' && (
                <Animated.View
                    style={[
                        styles.ringContainer,
                        {
                            width: size + 4,
                            height: size + 4,
                        },
                        ringStyle,
                    ]}
                    pointerEvents="none"
                    accessible={false}
                >
                    <Svg width={size + 4} height={size + 4} style={styles.svg}>
                        <Defs>
                            <LinearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={colors.start} stopOpacity={intensity} />
                                <Stop offset="50%" stopColor={colors.middle} stopOpacity={intensity} />
                                <Stop offset="100%" stopColor={colors.end} stopOpacity={intensity} />
                            </LinearGradient>
                        </Defs>
                        <Circle
                            cx={(size + 4) / 2}
                            cy={(size + 4) / 2}
                            r={ringRadius}
                            stroke="url(#aurora-gradient)"
                            strokeWidth={ringWidth}
                            fill="none"
                            opacity={0.8}
                        />
                    </Svg>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    ringContainer: {
        position: 'absolute',
        top: -2,
        left: -2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
});
