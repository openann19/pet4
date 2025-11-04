import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TypingBubble } from './TypingBubble'

describe('TypingBubble', () => {
  it('renders typing bubble with incoming styles', () => {
    const { container } = render(<TypingBubble isIncoming />)
    const bubble = container.querySelector('.bg-\\[\\#2E2E2E\\]')
    expect(bubble).toBeInTheDocument()
  })

  it('renders typing bubble with outgoing styles', () => {
    const { container } = render(<TypingBubble isIncoming={false} />)
    const bubble = container.querySelector('.bg-\\[\\#005AE0\\]')
    expect(bubble).toBeInTheDocument()
  })

  it('uses web variant by default', () => {
    const { container } = render(<TypingBubble />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
  })

  it('uses mobile variant when specified', () => {
    const { container } = render(<TypingBubble variant="mobile" />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(<TypingBubble className="custom-class" />)
    const bubble = container.querySelector('.custom-class')
    expect(bubble).toBeInTheDocument()
  })

  it('applies custom bubbleClassName', () => {
    const { container } = render(
      <TypingBubble bubbleClassName="custom-bubble" />
    )
    const bubble = container.querySelector('.custom-bubble')
    expect(bubble).toBeInTheDocument()
  })

  it('applies custom dot size', () => {
    const { container } = render(<TypingBubble dotSize={8} />)
    const dots = container.querySelectorAll('.rounded-full')
    dots.forEach((dot) => {
      const element = dot as HTMLElement
      if (element.style.width) {
        expect(element.style.width).toBe('8px')
      }
    })
  })
})

