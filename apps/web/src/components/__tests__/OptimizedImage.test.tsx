/**
 * OptimizedImage component tests
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OptimizedImage } from '../OptimizedImage';

// Mock image loader functions
vi.mock('@/lib/image-loader', () => ({
  supportsWebP: () => true,
  supportsAVIF: () => Promise.resolve(false),
}));

describe('OptimizedImage', () => {
  it('should render image with alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('should apply className', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" className="custom-class" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveClass('custom-class');
  });

  it('should set loading attribute', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" loading="eager" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should call onLoad when image loads', async () => {
    const onLoad = vi.fn();
    render(<OptimizedImage src="/test.jpg" alt="Test" onLoad={onLoad} />);
    
    const img = screen.getByAltText('Test');
    
    // Simulate image load
    img.dispatchEvent(new Event('load'));
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should call onError when image fails to load', async () => {
    const onError = vi.fn();
    render(<OptimizedImage src="/invalid.jpg" alt="Test" onError={onError} />);
    
    const img = screen.getByAltText('Test');
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should accept width and height props', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={200} height={150} />);
    const img = screen.getByAltText('Test');
    expect(img).toBeInTheDocument();
  });

  it('should accept quality prop', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" quality={75} />);
    const img = screen.getByAltText('Test');
    expect(img).toBeInTheDocument();
  });
});
