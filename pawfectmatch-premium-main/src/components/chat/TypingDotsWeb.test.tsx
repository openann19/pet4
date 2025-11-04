import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TypingDotsWeb } from './TypingDotsWeb'

describe('TypingDotsWeb', () => {
  it('renders three dots', () => {
    const { container } = render(<TypingDotsWeb />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
  })

  it('applies custom dot size', () => {
    const { container } = render(<TypingDotsWeb dotSize={8} />)
    const dots = container.querySelectorAll('.rounded-full')
    dots.forEach((dot) => {
      expect(dot).toHaveStyle({ width: '8px', height: '8px' })
    })
  })

  it('applies custom dot color', () => {
    const { container } = render(<TypingDotsWeb dotColor="#ff0000" />)
    const dots = container.querySelectorAll('.rounded-full')
    dots.forEach((dot) => {
      expect(dot).toHaveStyle({ backgroundColor: '#ff0000' })
    })
  })

  it('applies custom gap', () => {
    const { container } = render(<TypingDotsWeb gap={8} />)
    const flexContainer = container.firstChild as HTMLElement
    expect(flexContainer).toHaveStyle({ gap: '8px' })
  })

  it('applies custom className', () => {
    const { container } = render(<TypingDotsWeb className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses default values when props are not provided', () => {
    const { container } = render(<TypingDotsWeb />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
    dots.forEach((dot) => {
      expect(dot).toHaveStyle({ width: '6px', height: '6px' })
    })
  })
})

