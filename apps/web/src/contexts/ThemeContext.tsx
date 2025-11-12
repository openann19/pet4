/**
 * Theme Context
 * Provides theme mode state management and design token access via React Context
 * Replaces @github/spark/hooks useKV with project's useStorage implementation
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { applyTheme, type ThemeMode } from '@/lib/themes';
import {
    getColor,
    getSpacing,
    getRadius,
    getShadow,
    getZIndex,
    getGradient,
    getMotionDuration,
    getMotionEasing,
    getBreakpoint,
    getFontSize,
    getFontWeight,
    getLineHeight,
    getLetterSpacing,
    getFontFamily,
    getHitAreaMinimum,
    tokens,
} from '@/lib/design-tokens';
import type {
    SpacingKey,
    RadiiKey,
    ShadowKey,
    ZIndexKey,
    ColorKey,
    GradientKey,
    MotionDurationKey,
    MotionEasingKey,
    BreakpointKey,
    FontSizeKey,
    FontWeightKey,
    LineHeightKey,
    LetterSpacingKey,
} from '@/lib/types/design-tokens';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode | ((current: ThemeMode) => ThemeMode)) => void;
    toggle: () => void;
    tokens: {
        color: (key: ColorKey) => string;
        spacing: (key: SpacingKey) => string;
        radius: (key: RadiiKey) => string;
        shadow: (key: ShadowKey) => string;
        zIndex: (key: ZIndexKey) => number;
        gradient: (key: GradientKey) => string;
        motionDuration: (key: MotionDurationKey) => string;
        motionEasing: (key: MotionEasingKey) => string;
        breakpoint: (key: BreakpointKey) => string;
        fontSize: (key: FontSizeKey) => string;
        fontWeight: (key: FontWeightKey) => number;
        lineHeight: (key: LineHeightKey) => number;
        letterSpacing: (key: LetterSpacingKey) => string;
        fontFamily: (type: 'display' | 'body' | 'mono') => string;
        hitAreaMinimum: () => string;
    };
    rawTokens: typeof tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
    const [mode, setMode] = useStorage<ThemeMode>('theme-mode-v2', 'light');

    useEffect(() => {
        applyTheme(mode);
    }, [mode]);

    const toggle = (): void => {
        void setMode((current) => (current === 'light' ? 'dark' : 'light'));
    };

    const handleSetMode = (
        newMode: ThemeMode | ((current: ThemeMode) => ThemeMode)
    ): void => {
        void setMode(newMode);
    };

    const tokenUtils = useMemo(
        () => ({
            color: (key: ColorKey) => getColor(key, mode),
            spacing: (key: SpacingKey) => getSpacing(key),
            radius: (key: RadiiKey) => getRadius(key),
            shadow: (key: ShadowKey) => getShadow(key),
            zIndex: (key: ZIndexKey) => getZIndex(key),
            gradient: (key: GradientKey) => getGradient(key),
            motionDuration: (key: MotionDurationKey) => getMotionDuration(key),
            motionEasing: (key: MotionEasingKey) => getMotionEasing(key),
            breakpoint: (key: BreakpointKey) => getBreakpoint(key),
            fontSize: (key: FontSizeKey) => getFontSize(key),
            fontWeight: (key: FontWeightKey) => getFontWeight(key),
            lineHeight: (key: LineHeightKey) => getLineHeight(key),
            letterSpacing: (key: LetterSpacingKey) => getLetterSpacing(key),
            fontFamily: (type: 'display' | 'body' | 'mono') => getFontFamily(type),
            hitAreaMinimum: () => getHitAreaMinimum(),
        }),
        [mode]
    );

    const contextValue = useMemo(
        () => ({
            mode,
            setMode: handleSetMode,
            toggle,
            tokens: tokenUtils,
            rawTokens: tokens,
        }),
        [mode, tokenUtils]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeSystem(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeSystem must be used within ThemeProvider');
    }
    return context;
}
