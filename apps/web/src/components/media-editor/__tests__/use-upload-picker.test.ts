import { useUploadPicker } from '@/core/services/media/picker';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock window and document for web tests
const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

describe('useUploadPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('web platform', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'window', {
        value: window,
        writable: true,
      });
    });

    it('should pick image on web', async () => {
      const { result } = renderHook(() => useUploadPicker());

      // Mock document.createElement
      const mockInput = document.createElement('input');
      const mockClick = vi.fn();

      mockInput.click = mockClick;
      mockInput.addEventListener = vi.fn();
      mockInput.removeEventListener = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      // Mock Image
      const mockImage = new Image();
      const mockImageOnLoad = vi.fn();
      mockImage.onload = mockImageOnLoad;
      mockImage.onerror = vi.fn();
      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      // Mock URL.createObjectURL
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');

      result.current.pickImage();

      // Simulate file selection
      setTimeout(() => {
        Object.defineProperty(mockInput, 'files', {
          value: [mockFile],
          writable: true,
        });
        if (mockInput.onchange) {
          mockInput.onchange({} as Event);
        }
      }, 0);

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalled();
      });

      // Note: Full integration test would require more complex mocking
    });

    it('should handle cancelled pick on web', async () => {
      const { result } = renderHook(() => useUploadPicker());

      const mockInput = document.createElement('input');
      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      const pickPromise = result.current.pickImage();

      // Simulate cancellation (no files)
      setTimeout(() => {
        Object.defineProperty(mockInput, 'files', {
          value: null,
          writable: true,
        });
        if (mockInput.onchange) {
          mockInput.onchange({} as Event);
        }
      }, 0);

      const resultMedia = await pickPromise;
      expect(resultMedia).toBeNull();
    });
  });

  it('should return pick functions', () => {
    const { result } = renderHook(() => useUploadPicker());

    expect(result.current.pickAny).toBeDefined();
    expect(result.current.pickImage).toBeDefined();
    expect(result.current.pickVideo).toBeDefined();
    expect(typeof result.current.pickAny).toBe('function');
    expect(typeof result.current.pickImage).toBe('function');
    expect(typeof result.current.pickVideo).toBe('function');
  });
});
