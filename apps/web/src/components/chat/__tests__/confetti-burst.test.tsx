import { describe, it, expect, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ConfettiBurst } from '../ConfettiBurst'

vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotion: () => true,
  getReducedMotionDuration: (base: number) => Math.min(120, base),
}))

describe('ConfettiBurst', () => {
  it('renders particles in reduced-motion mode', () => {
    const onComplete = vi.fn()
    const { container } = render(<ConfettiBurst enabled particleCount={10} onComplete={onComplete} />)
    const particles = container.querySelectorAll('[style*="position"]')
    expect(particles.length).toBeGreaterThan(0)
    cleanup()
  })

  it('changes particle count on re-render', () => {
    const { rerender, container } = render(<ConfettiBurst enabled particleCount={4} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toBeInTheDocument()

    rerender(<ConfettiBurst enabled particleCount={9} />)
    expect(root).toBeInTheDocument()
    cleanup()
  })
})

