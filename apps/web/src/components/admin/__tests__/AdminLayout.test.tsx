import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminLayout from '../AdminLayout'
import { useStorage } from '@/hooks/useStorage'
import { useSidebarAnimation } from '@/effects/reanimated/use-sidebar-animation'
import { isTruthy, isDefined } from '@/core/guards';

vi.mock('@/hooks/useStorage')
vi.mock('@/effects/reanimated/use-sidebar-animation')
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

const mockUseStorage = vi.mocked(useStorage)
const mockUseSidebarAnimation = vi.mocked(useSidebarAnimation)

describe('AdminLayout', () => {
  const mockOnViewChange = vi.fn()
  const mockOnExit = vi.fn()
  const mockChildren = <div data-testid="test-children">Test Content</div>

  const mockSidebarAnimation = {
    animatedStyle: { width: 280 },
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'current-user') {
        return [
          {
            name: 'Test Admin',
            role: 'Super Admin',
          },
          vi.fn(),
          vi.fn(),
        ]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
    mockUseSidebarAnimation.mockReturnValue(mockSidebarAnimation as never)
  })

  it('renders children correctly', () => {
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByTestId('test-children')).toBeInTheDocument()
  })

  it('displays current user information when sidebar is open', () => {
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByText('Test Admin')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('displays default role when user has no role', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'current-user') {
        return [{ name: 'Test Admin' }, vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls onViewChange when menu item is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const reportsButton = screen.getByRole('button', { name: /reports/i })
    await user.click(reportsButton)

    expect(mockOnViewChange).toHaveBeenCalledWith('reports')
  })

  it('highlights active menu item', () => {
    render(
      <AdminLayout currentView="reports" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const reportsButton = screen.getByRole('button', { name: /reports/i })
    expect(reportsButton).toHaveClass('bg-primary')
  })

  it('calls onExit when exit button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout
        currentView="dashboard"
        onViewChange={mockOnViewChange}
        onExit={mockOnExit}
      >
        {mockChildren}
      </AdminLayout>
    )

    const exitButton = screen.getByLabelText(/go to main app/i)
    await user.click(exitButton)

    expect(mockOnExit).toHaveBeenCalledTimes(1)
  })

  it('handles sidebar toggle', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const toggleButton = screen.getByTitle(/collapse sidebar/i)
    await user.click(toggleButton)

    await waitFor(() => {
      expect(mockUseSidebarAnimation).toHaveBeenCalled()
    })
  })

  it('renders all menu items', () => {
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const menuItems = [
      'Dashboard',
      'Subscriptions',
      'Business Config',
      'Reports',
      'Users',
      'Community Posts',
      'Adoption Profiles',
      'Adoption Applications',
      'Content',
      'Photo Moderation',
      'Content Moderation',
      'Chat Moderation',
      'Verification Review',
      'KYC Management',
      'Lost & Found',
      'Live Streams',
      'API Config',
      'Settings',
      'Map Settings',
      'Performance',
      'System Map',
      'Audit Log',
    ]

    menuItems.forEach((item) => {
      expect(screen.getByRole('button', { name: new RegExp(item, 'i') })).toBeInTheDocument()
    })
  })

  it('handles navigation to main app when onExit is not provided', async () => {
    const user = userEvent.setup()
    const originalLocation = window.location

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })

    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const exitButtons = screen.getAllByLabelText(/go to main app/i)
    const lastExitButton = exitButtons[exitButtons.length - 1]
    if (isTruthy(lastExitButton)) {
      await user.click(lastExitButton)
    }

    expect(window.location.href).toBe('/')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('handles sign out button click', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    await user.click(signOutButton)

    expect(signOutButton).toBeInTheDocument()
  })

  it('handles error in view change gracefully', async () => {
    const user = userEvent.setup()
    const errorOnViewChange = vi.fn(() => {
      throw new Error('View change failed')
    })

    render(
      <AdminLayout currentView="dashboard" onViewChange={errorOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const reportsButton = screen.getByRole('button', { name: /reports/i })
    await user.click(reportsButton)

    expect(errorOnViewChange).toHaveBeenCalled()
  })

  it('handles error in sidebar toggle gracefully', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const toggleButton = screen.getByTitle(/collapse sidebar/i)
    await user.click(toggleButton)

    expect(toggleButton).toBeInTheDocument()
  })

  it('handles error in exit gracefully', async () => {
    const user = userEvent.setup()
    const errorOnExit = vi.fn(() => {
      throw new Error('Exit failed')
    })

    render(
      <AdminLayout
        currentView="dashboard"
        onViewChange={mockOnViewChange}
        onExit={errorOnExit}
      >
        {mockChildren}
      </AdminLayout>
    )

    const exitButton = screen.getByLabelText(/go to main app/i)
    await user.click(exitButton)

    expect(errorOnExit).toHaveBeenCalled()
  })

  it('renders sidebar with correct width when open', () => {
    mockUseSidebarAnimation.mockReturnValue({
      ...mockSidebarAnimation,
      animatedStyle: { width: 280 },
    } as never)

    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    expect(mockUseSidebarAnimation).toHaveBeenCalledWith({
      isOpen: true,
      openWidth: 280,
      closedWidth: 80,
      enableOpacity: true,
    })
  })

  it('shows tooltips when sidebar is collapsed', () => {
    mockUseSidebarAnimation.mockReturnValue({
      ...mockSidebarAnimation,
      animatedStyle: { width: 80 },
    } as never)

    render(
      <AdminLayout currentView="dashboard" onViewChange={mockOnViewChange}>
        {mockChildren}
      </AdminLayout>
    )

    const menuButtons = screen.getAllByRole('button')
    const buttonsWithTitle = menuButtons.filter(
      (button) => button.getAttribute('title') !== null
    )

    expect(buttonsWithTitle.length).toBeGreaterThan(0)
  })
})

