import { describe, it, expect } from 'vitest'
import { render, screen, rerender } from '@testing-library/react'
import { LinkPreview } from '../LinkPreview'

describe('LinkPreview', () => {
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
})

