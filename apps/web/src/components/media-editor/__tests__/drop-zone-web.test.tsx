import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DropZoneWeb } from '../drop-zone-web';

describe('DropZoneWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render drop zone on web', () => {
    const onDrop = vi.fn();
    render(<DropZoneWeb onDrop={onDrop} />);

    expect(screen.getByText('Drag & drop photo or video')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    const onDrop = vi.fn();
    render(<DropZoneWeb onDrop={onDrop} />);

    const dropZone = screen.getByText('Drag & drop photo or video').parentElement;
    expect(dropZone).toHaveAttribute('role', 'button');
  });

  it('should call onDrop when valid file is dropped', () => {
    const onDrop = vi.fn();
    render(<DropZoneWeb onDrop={onDrop} />);

    const dropZone = screen.getByText('Drag & drop photo or video').parentElement;

    if (dropZone) {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
        },
        writable: true,
      });

      dropZone.dispatchEvent(dropEvent);

      // Note: Full integration would require more setup
      expect(onDrop).toHaveBeenCalled();
    }
  });
});
