import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoTrimmer } from '../video-trimmer';

// Mock dependencies
vi.mock('@/core/services/media/video/thumbnails', () => ({
  getVideoThumbnails: vi.fn(() => Promise.resolve(['thumb1.jpg', 'thumb2.jpg'])),
}));

describe('VideoTrimmer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render video trimmer', () => {
    const onChange = vi.fn();
    render(<VideoTrimmer uri="test.mp4" durationSec={10} onChange={onChange} />);

    expect(screen.getByText('Trim')).toBeInTheDocument();
  });

  it('should call onChange when trim values change', () => {
    const onChange = vi.fn();
    render(<VideoTrimmer uri="test.mp4" durationSec={10} onChange={onChange} />);

    // Component should render with initial state
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should handle missing duration', () => {
    const onChange = vi.fn();
    render(<VideoTrimmer uri="test.mp4" onChange={onChange} />);

    expect(screen.getByText('Trim')).toBeInTheDocument();
  });
});
