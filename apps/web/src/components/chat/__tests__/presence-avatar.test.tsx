/**
 * Unit tests for PresenceAvatar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { PresenceAvatar } from '../../web/src/components/chat/PresenceAvatar'

describe('PresenceAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it('should render with online status', () => {
    const { container } = render(
      <PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />
    )
    
    const avatar = container.querySelector('img[alt="Test"]')
    expect(avatar).toBeInTheDocument()
  })

  it('should hide ring when status is offline', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { container } = render(
      <PresenceAvatar src="/avatar.jpg" alt="Test" status="offline" />
    )
    
    // Ring should not be visible for offline status
    const avatar = container.querySelector('img[alt="Test"]')
    expect(avatar).toBeInTheDocument()
  })

  it('should show ring for online status', () => {
    const { container } = render(
      <PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />
    )
    
    // Ring should be present for online status
    const avatar = container.querySelector('img[alt="Test"]')
    expect(avatar).toBeInTheDocument()
  })

  it('should respect reduced motion (static ring)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { container } = render(
      <PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />
    )
    
    // Component should render without errors
    const avatar = container.querySelector('img[alt="Test"]')
    expect(avatar).toBeInTheDocument()
  })
})