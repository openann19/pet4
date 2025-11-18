/**
 * Theme Context Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider, useThemeSystem } from '../ThemeContext';
import { useStorage } from '@/hooks/use-storage';
import { applyTheme } from '@/lib/themes';

vi.mock('@/hooks/use-storage');
vi.mock('@/lib/themes', () => ({
    applyTheme: vi.fn(),
    ThemeMode: {},
}));

const mockUseStorage = vi.mocked(useStorage);
const mockApplyTheme = vi.mocked(applyTheme);

describe('ThemeContext', () => {
    const mockSetModePromise = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
            if (key === 'theme-mode-v2') {
                return [defaultValue as 'light' | 'dark', mockSetModePromise, vi.fn()];
            }
            return [defaultValue, vi.fn(), vi.fn()];
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('ThemeProvider', () => {
        it('provides theme context to children', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            expect(result.current.mode).toBe('light');
            expect(result.current.setMode).toBeDefined();
            expect(result.current.toggle).toBeDefined();
            expect(result.current.tokens).toBeDefined();
            expect(result.current.rawTokens).toBeDefined();
        });

        it('calls applyTheme when mode changes', () => {
            mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'theme-mode-v2') {
                    return ['dark' as 'light' | 'dark', mockSetModePromise, vi.fn()];
                }
                return [defaultValue, vi.fn(), vi.fn()];
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            renderHook(() => useThemeSystem(), { wrapper });

            expect(mockApplyTheme).toHaveBeenCalledWith('dark');
        });

        it('calls applyTheme on initial render with light mode', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            renderHook(() => useThemeSystem(), { wrapper });

            expect(mockApplyTheme).toHaveBeenCalledWith('light');
        });
    });

    describe('useThemeSystem', () => {
        it('throws error when used outside ThemeProvider', () => {
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
                // Mock implementation to suppress React error logging
            });

            expect(() => {
                renderHook(() => useThemeSystem());
            }).toThrow('useThemeSystem must be used within ThemeProvider');

            errorSpy.mockRestore();
        });

        it('returns mode from storage', () => {
            mockUseStorage.mockImplementation((key: string) => {
                if (key === 'theme-mode-v2') {
                    return ['dark' as 'light' | 'dark', mockSetModePromise, vi.fn()];
                }
                return ['light', vi.fn(), vi.fn()];
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            expect(result.current.mode).toBe('dark');
        });

        it('setMode calls storage setMode with value', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.setMode('dark');
            });

            expect(mockSetModePromise).toHaveBeenCalledWith('dark');
        });

        it('setMode calls storage setMode with function', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.setMode((current) =>
                    current === 'light' ? 'dark' : 'light'
                );
            });

            expect(mockSetModePromise).toHaveBeenCalled();
            const callArg = mockSetModePromise.mock.calls[0]?.[0];
            expect(typeof callArg).toBe('function');
        });

        it('toggle switches from light to dark', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.toggle();
            });

            expect(mockSetModePromise).toHaveBeenCalled();
            // Verify the call was made with a function
            const calls = mockSetModePromise.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            if (calls[0]?.[0]) {
                expect(typeof calls[0][0]).toBe('function');
            }
        });

        it('toggle switches from dark to light', () => {
            mockUseStorage.mockImplementation((key: string) => {
                if (key === 'theme-mode-v2') {
                    return ['dark' as 'light' | 'dark', mockSetModePromise, vi.fn()];
                }
                return ['light', vi.fn(), vi.fn()];
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.toggle();
            });

            expect(mockSetModePromise).toHaveBeenCalled();
        });

        it('handles multiple rapid toggles', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.toggle();
                result.current.toggle();
                result.current.toggle();
            });

            expect(mockSetModePromise).toHaveBeenCalled();
        });

        it('handles setMode with function that returns current mode', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            act(() => {
                result.current.setMode((current) => current);
            });

            expect(mockSetModePromise).toHaveBeenCalled();
        });
    });

    describe('integration', () => {
        it('renders children correctly', () => {
            const TestComponent = (): JSX.Element => {
                const { mode } = useThemeSystem();
                return <div data-testid="theme-mode">{mode}</div>;
            };

            const { getByTestId } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(getByTestId('theme-mode').textContent).toBe('light');
        });

        it('updates child component when mode changes', () => {
            const TestComponent = (): JSX.Element => {
                const { mode, setMode } = useThemeSystem();
                return (
                    <div>
                        <div data-testid="theme-mode">{mode}</div>
                        <button
                            data-testid="toggle-button"
                            onClick={() => {
                                setMode('dark');
                            }}
                        >
                            Toggle
                        </button>
                    </div>
                );
            };

            const { getByTestId } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(getByTestId('theme-mode').textContent).toBe('light');

            act(() => {
                getByTestId('toggle-button').click();
            });

            expect(mockSetModePromise).toHaveBeenCalledWith('dark');
        });
    });

    describe('token utilities', () => {
        it('provides token utilities in context', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            expect(result.current.tokens.color).toBeDefined();
            expect(result.current.tokens.spacing).toBeDefined();
            expect(result.current.tokens.radius).toBeDefined();
            expect(result.current.tokens.shadow).toBeDefined();
            expect(result.current.tokens.zIndex).toBeDefined();
            expect(result.current.tokens.gradient).toBeDefined();
            expect(result.current.tokens.motionDuration).toBeDefined();
            expect(result.current.tokens.motionEasing).toBeDefined();
            expect(result.current.tokens.breakpoint).toBeDefined();
            expect(result.current.tokens.fontSize).toBeDefined();
            expect(result.current.tokens.fontWeight).toBeDefined();
            expect(result.current.tokens.lineHeight).toBeDefined();
            expect(result.current.tokens.letterSpacing).toBeDefined();
            expect(result.current.tokens.fontFamily).toBeDefined();
            expect(result.current.tokens.hitAreaMinimum).toBeDefined();
        });

        it('returns color tokens for current theme', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const background = result.current.tokens.color('background');
            expect(background).toBeTruthy();
            expect(background).toContain('oklch');
        });

        it('updates color tokens when theme changes', () => {
            mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'theme-mode-v2') {
                    return ['light' as 'light' | 'dark', mockSetModePromise, vi.fn()];
                }
                return [defaultValue, vi.fn(), vi.fn()];
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result, rerender } = renderHook(() => useThemeSystem(), { wrapper });

            const lightColor = result.current.tokens.color('background');

            mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'theme-mode-v2') {
                    return ['dark' as 'light' | 'dark', mockSetModePromise, vi.fn()];
                }
                return [defaultValue, vi.fn(), vi.fn()];
            });

            rerender();

            const darkColor = result.current.tokens.color('background');
            expect(darkColor).not.toBe(lightColor);
        });

        it('returns spacing tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const spacing = result.current.tokens.spacing('4');
            expect(spacing).toBe('16px');
        });

        it('returns radius tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const radius = result.current.tokens.radius('md');
            expect(radius).toBe('8px');
        });

        it('returns shadow tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const shadow = result.current.tokens.shadow('sm');
            expect(shadow).toBeTruthy();
        });

        it('returns z-index tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const zIndex = result.current.tokens.zIndex('modal');
            expect(zIndex).toBe(1400);
        });

        it('returns gradient tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const gradient = result.current.tokens.gradient('primary');
            expect(gradient).toBeTruthy();
            expect(gradient).toContain('linear-gradient');
        });

        it('returns motion duration tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const duration = result.current.tokens.motionDuration('fast');
            expect(duration).toBe('150ms');
        });

        it('returns motion easing tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const easing = result.current.tokens.motionEasing('easeInOut');
            expect(easing).toBeTruthy();
        });

        it('returns breakpoint tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const breakpoint = result.current.tokens.breakpoint('md');
            expect(breakpoint).toBe('768px');
        });

        it('returns typography tokens', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            expect(result.current.tokens.fontSize('base')).toBe('16px');
            expect(result.current.tokens.fontWeight('bold')).toBe(700);
            expect(result.current.tokens.lineHeight('normal')).toBe(1.5);
            expect(result.current.tokens.letterSpacing('normal')).toBe('0');
            expect(result.current.tokens.fontFamily('display')).toBeTruthy();
        });

        it('returns hit area minimum', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            const hitArea = result.current.tokens.hitAreaMinimum();
            expect(hitArea).toBe('44px');
        });

        it('provides raw tokens access', () => {
            const wrapper = ({ children }: { children: ReactNode }) => (
                <ThemeProvider>{children}</ThemeProvider>
            );

            const { result } = renderHook(() => useThemeSystem(), { wrapper });

            expect(result.current.rawTokens).toBeDefined();
            expect(result.current.rawTokens.spacing).toBeDefined();
            expect(result.current.rawTokens.colors).toBeDefined();
            expect(result.current.rawTokens.typography).toBeDefined();
        });
    });
});
