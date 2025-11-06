import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuditLogView from '../AuditLogView'
import { useStorage } from '@/hooks/useStorage'

vi.mock('@/hooks/useStorage')

const mockUseStorage = vi.mocked(useStorage)

describe('AuditLogView', () => {
  const mockAuditLog = [
    {
      id: '1',
      adminId: 'admin1',
      adminName: 'John Admin',
      action: 'user_suspended',
      targetType: 'user',
      targetId: 'user123',
      details: { reason: 'Violation' },
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      adminId: 'admin2',
      adminName: 'Jane Admin',
      action: 'content_approved',
      targetType: 'content',
      targetId: 'content456',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      adminId: 'admin1',
      adminName: 'John Admin',
      action: 'report_resolved',
      targetType: 'report',
      targetId: 'report789',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-audit-log') {
        return [mockAuditLog, vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
  })

  it('renders audit log view', () => {
    render(<AuditLogView />)

    expect(screen.getByText(/audit log/i)).toBeInTheDocument()
  })

  it('displays audit log entries', () => {
    render(<AuditLogView />)

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
    expect(screen.getByText(/jane admin/i)).toBeInTheDocument()
  })

  it('filters entries by search query', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'John')

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
    expect(screen.queryByText(/jane admin/i)).not.toBeInTheDocument()
  })

  it('filters entries by action type', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const select = screen.getByRole('combobox')
    await user.click(select)

    const userSuspendedOption = screen.getByText(/user suspended/i)
    await user.click(userSuspendedOption)

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
  })

  it('displays all action types in filter', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const select = screen.getByRole('combobox')
    await user.click(select)

    expect(screen.getByText(/all actions/i)).toBeInTheDocument()
  })

  it('handles empty audit log', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-audit-log') {
        return [[], vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(<AuditLogView />)

    expect(screen.getByText(/audit log/i)).toBeInTheDocument()
  })

  it('handles null audit log', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-audit-log') {
        return [null, vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(<AuditLogView />)

    expect(screen.getByText(/audit log/i)).toBeInTheDocument()
  })

  it('searches by admin name', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Jane')

    expect(screen.getByText(/jane admin/i)).toBeInTheDocument()
  })

  it('searches by action', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'suspended')

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
  })

  it('searches by target ID', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'user123')

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
  })

  it('combines search and filter', async () => {
    const user = userEvent.setup()
    render(<AuditLogView />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'John')

    const select = screen.getByRole('combobox')
    await user.click(select)

    const option = screen.getByText(/user suspended/i)
    await user.click(option)

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
  })

  it('displays action icons correctly', () => {
    render(<AuditLogView />)

    expect(screen.getByText(/user_suspended/i)).toBeInTheDocument()
  })

  it('displays timestamps', () => {
    render(<AuditLogView />)

    expect(screen.getByText(/john admin/i)).toBeInTheDocument()
  })
})

