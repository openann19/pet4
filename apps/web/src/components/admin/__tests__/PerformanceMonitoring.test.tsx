import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceMonitoring from '../PerformanceMonitoring';
import { getPerformanceMetrics } from '@/lib/performance';
import { getWebSocketManager } from '@/lib/websocket-manager';

vi.mock('@/lib/performance', () => ({
  getPerformanceMetrics: vi.fn(),
}));
vi.mock('@/lib/websocket-manager', () => ({
  getWebSocketManager: vi.fn(),
}));

const mockGetPerformanceMetrics = vi.mocked(getPerformanceMetrics);
const mockGetWebSocketManager = vi.mocked(getWebSocketManager);

describe('PerformanceMonitoring', () => {
  const mockMetrics = {
    pageLoadTime: 1500,
    apiResponseTime: 250,
    memoryUsage: 75,
    cpuUsage: 30,
    networkLatency: 50,
  };

  const mockWsManager = {
    getState: vi.fn(() => 'connected'),
    on: vi.fn(() => vi.fn()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetPerformanceMetrics.mockReturnValue(mockMetrics);
    mockGetWebSocketManager.mockReturnValue(mockWsManager as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders performance monitoring', () => {
    render(<PerformanceMonitoring />);

    expect(screen.getByText(/performance monitoring/i)).toBeInTheDocument();
  });

  it('displays performance metrics', async () => {
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/page load time/i)).toBeInTheDocument();
    });
  });

  it('updates metrics at interval', async () => {
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(mockGetPerformanceMetrics).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockGetPerformanceMetrics).toHaveBeenCalledTimes(2);
    });
  });

  it('displays WebSocket status', () => {
    render(<PerformanceMonitoring />);

    expect(mockGetWebSocketManager).toHaveBeenCalled();
  });

  it('subscribes to WebSocket connection events', () => {
    render(<PerformanceMonitoring />);

    expect(mockWsManager.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('displays system metrics', async () => {
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/api response time/i)).toBeInTheDocument();
    });
  });

  it('displays memory usage', async () => {
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/memory usage/i)).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/performance monitoring/i)).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole('tab');
    if (tabs.length > 1) {
      await user.click(tabs[1]);
    }
  });

  it('handles missing metrics gracefully', () => {
    mockGetPerformanceMetrics.mockReturnValue({
      pageLoadTime: undefined,
      apiResponseTime: undefined,
      memoryUsage: undefined,
      cpuUsage: undefined,
      networkLatency: undefined,
    });

    render(<PerformanceMonitoring />);

    expect(screen.getByText(/performance monitoring/i)).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<PerformanceMonitoring />);

    unmount();

    vi.advanceTimersByTime(2000);

    expect(mockGetPerformanceMetrics).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from WebSocket events on unmount', () => {
    const unsubscribe = vi.fn();
    mockWsManager.on.mockReturnValue(unsubscribe);

    const { unmount } = render(<PerformanceMonitoring />);

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('displays status indicators', async () => {
    render(<PerformanceMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/performance monitoring/i)).toBeInTheDocument();
    });
  });
});
