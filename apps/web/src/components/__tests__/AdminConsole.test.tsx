import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminConsole from '../AdminConsole'

// Mock dependencies
vi.mock('@/components/admin/AdminLayout', () => ({
  default: ({ children, currentView, onViewChange }: { 
    children: React.ReactNode; 
    currentView: string; 
    onViewChange: (view: string) => void;
  }) => (
    <div data-testid="admin-layout">
      <div>Current View: {currentView}</div>
      <button onClick={() => onViewChange('reports')}>Switch to Reports</button>
      {children}
    </div>
  )
}))

vi.mock('@/core/services/admin-sync-service', () => ({
  adminSyncService: {
    initialize: vi.fn(),
    disconnect: vi.fn()
  }
}))

vi.mock('@/lib/realtime', () => ({
  realtime: {
    connect: vi.fn(),
    disconnect: vi.fn()
  }
}))

// Mock all lazy-loaded admin components
vi.mock('@/components/admin/DashboardView', () => ({
  default: () => <div data-testid="dashboard-view">Dashboard</div>
}))

vi.mock('@/components/admin/ReportsView', () => ({
  default: () => <div data-testid="reports-view">Reports</div>
}))

describe('AdminConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render admin console with dashboard view', async () => {
    render(<AdminConsole />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument()
    })
  })

  it('should initialize admin sync service on mount', async () => {
    const { adminSyncService } = await import('@/core/services/admin-sync-service')
    const { realtime } = await import('@/lib/realtime')

    render(<AdminConsole />)

    await waitFor(() => {
      expect(adminSyncService.initialize).toHaveBeenCalledWith(realtime)
    })
  })

  it('should call onClose when provided', async () => {
    const onClose = vi.fn()
    const { unmount } = render(<AdminConsole onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
    })

    unmount()
  })
})

