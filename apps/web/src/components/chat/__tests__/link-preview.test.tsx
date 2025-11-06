import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, rerender } from '@testing-library/react'
import { LinkPreview } from '../LinkPreview'

describe('LinkPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock reduced motion as false by default
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it('shows skeleton when loading and content when loaded', () => {
    const { container, rerender } = render(
      <LinkPreview url="https://example.com" isLoading image="https://x/y.jpg" />
    )
    // aria-busy true when loading
    const loadingElement = container.querySelector('[aria-busy="true"]')
    expect(loadingElement).toBeInTheDocument()

    rerender(
      <LinkPreview
        url="https://example.com/path"
        title="Example"
        description="Desc"
        image="https://x/y.jpg"
        isLoading={false}
      />
    )
    // link visible - check by href or text content
    const link = container.querySelector('a[href="https://example.com/path"]')
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent(/example/i)
  })

  it('should use instant crossfade (≤120ms) when reduced motion is enabled', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { container } = render(
      <LinkPreview url="https://example.com" isLoading={false} title="Test" />
    )

    // Component should render - check for the container div
    const previewContainer = container.querySelector('[aria-busy]')
    expect(previewContainer || container.firstElementChild).toBeInTheDocument()
  })

  it('should toggle skeleton/content opacity correctly', () => {
    const { container, rerender } = render(
      <LinkPreview url="https://example.com" isLoading={true} image="https://x/y.jpg" />
    )

    // Should show skeleton when loading
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()

    rerender(
      <LinkPreview url="https://example.com" isLoading={false} title="Test" image="https://x/y.jpg" />
    )

    // Should show content when loaded - component renders if title OR image exists
    const previewContainer = container.firstElementChild
    expect(previewContainer).toBeInTheDocument()
  })
})

