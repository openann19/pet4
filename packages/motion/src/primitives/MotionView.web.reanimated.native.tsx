import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { forwardRef, useEffect, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

// Import from web effects - these will be available at runtime
// Using dynamic import pattern to avoid circular dependencies
let AnimatedView: typeof import('../../../apps/web/src/effects/reanimated/animated-view').AnimatedView;
let springConfigs: typeof import('../../../apps/web/src/effects/reanimated/transitions').springConfigs;
let timingConfigs: typeof import('../../../apps/web/src/effects/reanimated/transitions').timingConfigs;
let AnimatedStyle: typeof import('../../../apps/web/src/effects/reanimated/animated-view').AnimatedStyle;

// Lazy load to avoid circular deps
async function loadReanimatedUtils() {
    if (!AnimatedView) {
        const reanimated = await import('../../../apps/web/src/effects/reanimated/animated-view');
        const transitions = await import('../../../apps/web/src/effects/reanimated/transitions');
        AnimatedView = reanimated.AnimatedView;
        AnimatedStyle = reanimated.AnimatedStyle;
        springConfigs = transitions.springConfigs;
        timingConfigs = transitions.timingConfigs;
    }
}

interface HoverStyle {
    scale?: number;
    opacity?: number;
    rotate?: number;
    translateX?: number;
    translateY?: number;
    x?: number;
    y?: number;
}

type AsTag = 'div' | 'button';

type DivAttributes = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onMouseEnter' | 'onMouseLeave' | 'onMouseDown' | 'onMouseUp' | 'onClick' | 'onTouchStart' | 'onTouchEnd'
>;

type ButtonAttributes = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onMouseEnter' | 'onMouseLeave' | 'onMouseDown' | 'onMouseUp' | 'onClick' | 'onTouchStart' | 'onTouchEnd'
>;

interface MotionViewCommonProps {
    children?: React.ReactNode;
    animatedStyle?: AnimatedStyle;
    whileHover?: HoverStyle;
    whileTap?: HoverStyle;
    initial?: {
        opacity?: number;
        scale?: number;
        x?: number;
        y?: number;
        translateX?: number;
        translateY?: number;
    } | boolean;
    animate?: {
        opacity?: number;
        scale?: number;
        x?: number;
        y?: number;
        translateX?: number;
        translateY?: number;
    } | boolean;
    exit?: {
        opacity?: number;
        scale?: number;
        x?: number;
        y?: number;
        translateX?: number;
        translateY?: number;
    };
    transition?: {
        type?: 'spring' | 'timing';
        duration?: number;
        stiffness?: number;
        damping?: number;
    };
    as?: AsTag;
    layout?: boolean | 'position' | 'size';
    layoutId?: string;
    onHoverStart?: (event: MouseEvent) => void;
    onHoverEnd?: (event: MouseEvent) => void;
    onTapStart?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
    onTap?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
    onTapCancel?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: unknown;
    dragElastic?: number;
    dragMomentum?: boolean;
    onDragStart?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
    onDrag?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
    onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent) => void;
}

type MotionViewWebProps =
    | (MotionViewCommonProps &
        DivAttributes & {
            as?: 'div';
            onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
            onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
            onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
            onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
            onClick?: React.MouseEventHandler<HTMLDivElement>;
            onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
            onTouchEnd?: React.TouchEventHandler<HTMLDivElement>;
        })
    | (MotionViewCommonProps &
        ButtonAttributes & {
            as: 'button';
            onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
            onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
            onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
            onMouseUp?: React.MouseEventHandler<HTMLButtonElement>;
            onClick?: React.MouseEventHandler<HTMLButtonElement>;
            onTouchStart?: React.TouchEventHandler<HTMLButtonElement>;
            onTouchEnd?: React.TouchEventHandler<HTMLButtonElement>;
        });

/**
 * Web-specific MotionView component using React Native Reanimated.
 * Replaces framer-motion with Reanimated for better performance and mobile compatibility.
 */
export const MotionView: ForwardRefExoticComponent<
    MotionViewWebProps & RefAttributes<HTMLDivElement | HTMLButtonElement>
> = forwardRef<HTMLDivElement | HTMLButtonElement, MotionViewWebProps>(
    (
        {
            children,
            whileHover,
            whileTap,
            initial,
            animate,
            exit,
            transition,
            animatedStyle: _animatedStyle,
            as = 'div',
            layout: _layout,
            layoutId: _layoutId,
            onHoverStart,
            onHoverEnd,
            onTapStart,
            onTap,
            onTapCancel,
            drag: _drag,
            dragConstraints: _dragConstraints,
            dragElastic: _dragElastic,
            dragMomentum: _dragMomentum,
            onDragStart: _onDragStart,
            onDrag: _onDrag,
            onDragEnd: _onDragEnd,
            ...restProps
        },
        ref
    ) => {
        const opacity = useSharedValue(1);
        const scale = useSharedValue(1);
        const translateX = useSharedValue(0);
        const translateY = useSharedValue(0);
        const rotate = useSharedValue(0);
        const isHovered = useSharedValue(0);
        const isPressed = useSharedValue(0);

        // Initialize values from initial prop
        useEffect(() => {
            if (initial && typeof initial === 'object') {
                opacity.value = initial.opacity ?? 1;
                scale.value = initial.scale ?? 1;
                translateX.value = initial.x ?? initial.translateX ?? 0;
                translateY.value = initial.y ?? initial.translateY ?? 0;
            } else if (initial === false) {
                opacity.value = 0;
                scale.value = 0.95;
            }
        }, [initial, opacity, scale, translateX, translateY]);

        // Animate to animate prop values
        useEffect(() => {
            if (animate && typeof animate === 'object') {
                const config = transition?.type === 'spring'
                    ? { stiffness: transition.stiffness ?? springConfigs.smooth.stiffness, damping: transition.damping ?? springConfigs.smooth.damping }
                    : { duration: transition?.duration ?? timingConfigs.smooth.duration };

                if (animate.opacity !== undefined) {
                    opacity.value = transition?.type === 'spring'
                        ? withSpring(animate.opacity, config)
                        : withTiming(animate.opacity, config);
                }
                if (animate.scale !== undefined) {
                    scale.value = transition?.type === 'spring'
                        ? withSpring(animate.scale, config)
                        : withTiming(animate.scale, config);
                }
                if (animate.x !== undefined || animate.translateX !== undefined) {
                    translateX.value = transition?.type === 'spring'
                        ? withSpring(animate.x ?? animate.translateX ?? 0, config)
                        : withTiming(animate.x ?? animate.translateX ?? 0, config);
                }
                if (animate.y !== undefined || animate.translateY !== undefined) {
                    translateY.value = transition?.type === 'spring'
                        ? withSpring(animate.y ?? animate.translateY ?? 0, config)
                        : withTiming(animate.y ?? animate.translateY ?? 0, config);
                }
            } else if (animate === true) {
                opacity.value = withSpring(1, springConfigs.smooth);
                scale.value = withSpring(1, springConfigs.smooth);
                translateX.value = withSpring(0, springConfigs.smooth);
                translateY.value = withSpring(0, springConfigs.smooth);
            }
        }, [animate, transition, opacity, scale, translateX, translateY]);

        // Handle hover
        const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
            if (whileHover) {
                isHovered.value = 1;
                if (whileHover.scale !== undefined) {
                    scale.value = withSpring(whileHover.scale, springConfigs.smooth);
                }
                if (whileHover.opacity !== undefined) {
                    opacity.value = withSpring(whileHover.opacity, springConfigs.smooth);
                }
                if (whileHover.translateX !== undefined || whileHover.x !== undefined) {
                    translateX.value = withSpring(whileHover.translateX ?? whileHover.x ?? 0, springConfigs.smooth);
                }
                if (whileHover.translateY !== undefined || whileHover.y !== undefined) {
                    translateY.value = withSpring(whileHover.translateY ?? whileHover.y ?? 0, springConfigs.smooth);
                }
                if (whileHover.rotate !== undefined) {
                    rotate.value = withSpring(whileHover.rotate, springConfigs.smooth);
                }
            }
            onHoverStart?.(e as unknown as MouseEvent);
        };

        const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
            if (whileHover) {
                isHovered.value = 0;
                scale.value = withSpring(1, springConfigs.smooth);
                opacity.value = withSpring(1, springConfigs.smooth);
                translateX.value = withSpring(0, springConfigs.smooth);
                translateY.value = withSpring(0, springConfigs.smooth);
                rotate.value = withSpring(0, springConfigs.smooth);
            }
            onHoverEnd?.(e as unknown as MouseEvent);
        };

        // Handle tap/press
        const handleMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
            if (whileTap) {
                isPressed.value = 1;
                if (whileTap.scale !== undefined) {
                    scale.value = withSpring(whileTap.scale, springConfigs.smooth);
                }
                if (whileTap.opacity !== undefined) {
                    opacity.value = withSpring(whileTap.opacity, springConfigs.smooth);
                }
            }
            onTapStart?.(e as unknown as MouseEvent | TouchEvent | PointerEvent);
        };

        const handleMouseUp = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
            if (whileTap) {
                isPressed.value = 0;
                const targetScale = isHovered.value === 1 && whileHover?.scale ? whileHover.scale : 1;
                scale.value = withSpring(targetScale, springConfigs.smooth);
                opacity.value = withSpring(1, springConfigs.smooth);
            }
            onTap?.(e as unknown as MouseEvent | TouchEvent | PointerEvent);
        };

        const animatedStyle = useAnimatedStyle(() => {
            return {
                opacity: opacity.value,
                transform: [
                    { scale: scale.value },
                    { translateX: `${translateX.value}px` },
                    { translateY: `${translateY.value}px` },
                    { rotate: `${rotate.value}deg` },
                ],
            };
        }) as AnimatedStyle;

        const Component = as === 'button' ? 'button' : 'div';

        return (
            <AnimatedView
                ref={ref as never}
                as={Component}
                style={animatedStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                {...(restProps as Record<string, unknown>)}
            >
                {children}
            </AnimatedView>
        );
    }
);

MotionView.displayName = 'MotionView';
