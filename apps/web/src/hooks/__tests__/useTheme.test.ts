import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { useStorage } from '../use-storage';
import { getThemePreset, applyThemePreset } from '@/lib/theme-presets';

vi.mock('../use-storage');
vi.mock('@/lib/theme-presets', () => ({
  getThemePreset: vi.fn((preset: string) => ({
    name: preset,
    colors: {},
  })),
  applyThemePreset: vi.fn(),
}));

const mockUseStorage = vi.mocked(useStorage);
const mockGetThemePreset = vi.mocked(getThemePreset);
const mockApplyThemePreset = vi.mocked(applyThemePreset);

describe('useTheme', () => {
  const mockSetThemeState = vi.fn();
  const mockSetThemePresetState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return ['light', mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return ['default-light', mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('returns light theme by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
  });

  it('applies dark class when theme is dark', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return ['dark', mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return ['default-dark', mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark');
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return ['light', mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return ['default-light', mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies theme preset when preset is available', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return ['light', mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return ['ocean', mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    renderHook(() => useTheme());

    expect(mockGetThemePreset).toHaveBeenCalledWith('ocean');
    expect(mockApplyThemePreset).toHaveBeenCalled();
  });

  it('sets theme to light', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(mockSetThemeState).toHaveBeenCalled();
  });

  it('sets theme to dark', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockSetThemeState).toHaveBeenCalled();
  });

  it('sets theme using function', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    });

    expect(mockSetThemeState).toHaveBeenCalled();
  });

  it('toggles theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(mockSetThemeState).toHaveBeenCalled();
  });

  it('sets theme preset', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setThemePreset('ocean');
    });

    expect(mockSetThemePresetState).toHaveBeenCalled();
  });

  it('sets theme preset using function', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setThemePreset((current) =>
        current === 'default-light' ? 'default-dark' : 'default-light'
      );
    });

    expect(mockSetThemePresetState).toHaveBeenCalled();
  });

  it('updates preset when theme changes to dark', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockSetThemePresetState).toHaveBeenCalledWith('default-dark');
  });

  it('updates preset when theme changes to light', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(mockSetThemePresetState).toHaveBeenCalledWith('default-light');
  });

  it('updates preset when theme is toggled', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(mockSetThemePresetState).toHaveBeenCalled();
  });

  it('handles null theme gracefully', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return [null, mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return ['default-light', mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockSetThemeState).toHaveBeenCalled();
  });

  it('handles missing preset gracefully', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'app-theme-v2') {
        return ['light', mockSetThemeState, vi.fn()];
      }
      if (key === 'app-theme-preset-v1') {
        return [null, mockSetThemePresetState, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    mockGetThemePreset.mockReturnValue(undefined);

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
