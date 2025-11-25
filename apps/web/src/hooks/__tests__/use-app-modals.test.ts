import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAppModals } from '../use-app-modals';

describe('useAppModals', () => {
  it('should initialize with all modals closed', () => {
    const { result } = renderHook(() => useAppModals());

    expect(result.current.showGenerateProfiles).toBe(false);
    expect(result.current.showStats).toBe(false);
    expect(result.current.showMap).toBe(false);
    expect(result.current.showAdminConsole).toBe(false);
    expect(result.current.showThemeSettings).toBe(false);
  });

  it('should provide setter functions for each modal', () => {
    const { result } = renderHook(() => useAppModals());

    expect(typeof result.current.setShowGenerateProfiles).toBe('function');
    expect(typeof result.current.setShowStats).toBe('function');
    expect(typeof result.current.setShowMap).toBe('function');
    expect(typeof result.current.setShowAdminConsole).toBe('function');
    expect(typeof result.current.setShowThemeSettings).toBe('function');
  });

  it('should provide open functions for each modal', () => {
    const { result } = renderHook(() => useAppModals());

    expect(typeof result.current.openGenerateProfiles).toBe('function');
    expect(typeof result.current.openStats).toBe('function');
    expect(typeof result.current.openMap).toBe('function');
    expect(typeof result.current.openAdminConsole).toBe('function');
    expect(typeof result.current.openThemeSettings).toBe('function');
  });

  it('should provide closeAllModals function', () => {
    const { result } = renderHook(() => useAppModals());

    expect(typeof result.current.closeAllModals).toBe('function');
  });

  describe('Individual Modal Controls', () => {
    it('should open and close generate profiles modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Initially closed
      expect(result.current.showGenerateProfiles).toBe(false);

      // Open using setter
      act(() => {
        result.current.setShowGenerateProfiles(true);
      });
      expect(result.current.showGenerateProfiles).toBe(true);

      // Close using setter
      act(() => {
        result.current.setShowGenerateProfiles(false);
      });
      expect(result.current.showGenerateProfiles).toBe(false);
    });

    it('should open and close stats modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Initially closed
      expect(result.current.showStats).toBe(false);

      // Open using setter
      act(() => {
        result.current.setShowStats(true);
      });
      expect(result.current.showStats).toBe(true);

      // Close using setter
      act(() => {
        result.current.setShowStats(false);
      });
      expect(result.current.showStats).toBe(false);
    });

    it('should open and close map modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Initially closed
      expect(result.current.showMap).toBe(false);

      // Open using setter
      act(() => {
        result.current.setShowMap(true);
      });
      expect(result.current.showMap).toBe(true);

      // Close using setter
      act(() => {
        result.current.setShowMap(false);
      });
      expect(result.current.showMap).toBe(false);
    });

    it('should open and close admin console modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Initially closed
      expect(result.current.showAdminConsole).toBe(false);

      // Open using setter
      act(() => {
        result.current.setShowAdminConsole(true);
      });
      expect(result.current.showAdminConsole).toBe(true);

      // Close using setter
      act(() => {
        result.current.setShowAdminConsole(false);
      });
      expect(result.current.showAdminConsole).toBe(false);
    });

    it('should open and close theme settings modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Initially closed
      expect(result.current.showThemeSettings).toBe(false);

      // Open using setter
      act(() => {
        result.current.setShowThemeSettings(true);
      });
      expect(result.current.showThemeSettings).toBe(true);

      // Close using setter
      act(() => {
        result.current.setShowThemeSettings(false);
      });
      expect(result.current.showThemeSettings).toBe(false);
    });
  });

  describe('Open Functions', () => {
    it('should open generate profiles modal using openGenerateProfiles', () => {
      const { result } = renderHook(() => useAppModals());

      act(() => {
        result.current.openGenerateProfiles();
      });

      expect(result.current.showGenerateProfiles).toBe(true);
      // Other modals should remain closed
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });

    it('should open stats modal using openStats', () => {
      const { result } = renderHook(() => useAppModals());

      act(() => {
        result.current.openStats();
      });

      expect(result.current.showStats).toBe(true);
      // Other modals should remain closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });

    it('should open map modal using openMap', () => {
      const { result } = renderHook(() => useAppModals());

      act(() => {
        result.current.openMap();
      });

      expect(result.current.showMap).toBe(true);
      // Other modals should remain closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });

    it('should open admin console modal using openAdminConsole', () => {
      const { result } = renderHook(() => useAppModals());

      act(() => {
        result.current.openAdminConsole();
      });

      expect(result.current.showAdminConsole).toBe(true);
      // Other modals should remain closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });

    it('should open theme settings modal using openThemeSettings', () => {
      const { result } = renderHook(() => useAppModals());

      act(() => {
        result.current.openThemeSettings();
      });

      expect(result.current.showThemeSettings).toBe(true);
      // Other modals should remain closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
    });
  });

  describe('closeAllModals', () => {
    it('should close all modals when called', () => {
      const { result } = renderHook(() => useAppModals());

      // Open all modals
      act(() => {
        result.current.setShowGenerateProfiles(true);
        result.current.setShowStats(true);
        result.current.setShowMap(true);
        result.current.setShowAdminConsole(true);
        result.current.setShowThemeSettings(true);
      });

      // Verify all are open
      expect(result.current.showGenerateProfiles).toBe(true);
      expect(result.current.showStats).toBe(true);
      expect(result.current.showMap).toBe(true);
      expect(result.current.showAdminConsole).toBe(true);
      expect(result.current.showThemeSettings).toBe(true);

      // Close all modals
      act(() => {
        result.current.closeAllModals();
      });

      // Verify all are closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });

    it('should work when all modals are already closed', () => {
      const { result } = renderHook(() => useAppModals());

      // All modals should be closed initially
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);

      // Close all modals should not throw
      act(() => {
        result.current.closeAllModals();
      });

      // All should still be closed
      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(false);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });
  });

  describe('State Independence', () => {
    it('should maintain independent state for each modal', () => {
      const { result } = renderHook(() => useAppModals());

      // Open multiple modals
      act(() => {
        result.current.openGenerateProfiles();
        result.current.openStats();
      });

      expect(result.current.showGenerateProfiles).toBe(true);
      expect(result.current.showStats).toBe(true);
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);

      // Close one modal
      act(() => {
        result.current.setShowGenerateProfiles(false);
      });

      expect(result.current.showGenerateProfiles).toBe(false);
      expect(result.current.showStats).toBe(true); // Should remain open
      expect(result.current.showMap).toBe(false);
      expect(result.current.showAdminConsole).toBe(false);
      expect(result.current.showThemeSettings).toBe(false);
    });
  });

  describe('Return Type Consistency', () => {
    it('should return consistent object structure', () => {
      const { result } = renderHook(() => useAppModals());

      const hookReturn = result.current;

      // Check that all expected properties exist
      const expectedKeys = [
        'showGenerateProfiles',
        'showStats',
        'showMap',
        'showAdminConsole',
        'showThemeSettings',
        'setShowGenerateProfiles',
        'setShowStats',
        'setShowMap',
        'setShowAdminConsole',
        'setShowThemeSettings',
        'openGenerateProfiles',
        'openStats',
        'openMap',
        'openAdminConsole',
        'openThemeSettings',
        'closeAllModals',
      ];

      expectedKeys.forEach((key) => {
        expect(hookReturn).toHaveProperty(key);
      });

      // Check that there are no extra properties
      expect(Object.keys(hookReturn)).toHaveLength(expectedKeys.length);
    });
  });
});
