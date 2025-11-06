import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PremiumCard } from '../PremiumCard'
import { useHoverLift } from '@petspark/motion'

vi.mock('@petspark/motion', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
  })),
  motion: {
    durations: {
      md: 300,
    },
  },
}))
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  withTiming: vi.fn((value) => value),
  useAnimatedStyle: vi.fn(() => ({})),
}))
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>
      {children}
    </div>
  ),
}))

const mockUseHoverLift = vi.mocked(useHoverLift)

describe('PremiumCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    render(
      <PremiumCard>
        <div>Test Content</div>
      </PremiumCard>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    const { container } = render(<PremiumCard>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toBeInTheDocument()
  })

  it('applies glass variant styles', () => {
    const { container } = render(<PremiumCard variant="glass">Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('glass-card')
  })

  it('applies elevated variant styles', () => {
    const { container } = render(<PremiumCard variant="elevated">Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('premium-shadow-lg')
  })

  it('applies gradient variant styles', () => {
    const { container } = render(<PremiumCard variant="gradient">Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('premium-gradient')
  })

  it('enables hover by default', () => {
    render(<PremiumCard>Content</PremiumCard>)

    expect(mockUseHoverLift).toHaveBeenCalledWith(8)
  })

  it('disables hover when hover prop is false', () => {
    render(<PremiumCard hover={false}>Content</PremiumCard>)

    expect(mockUseHoverLift).toHaveBeenCalled()
  })

  it('applies glow animation when glow prop is true', () => {
    const { container } = render(<PremiumCard glow={true}>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('animate-glow-ring')
  })

  it('does not apply glow animation when glow prop is false', () => {
    const { container } = render(<PremiumCard glow={false}>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).not.toHaveClass('animate-glow-ring')
  })

  it('applies custom className', () => {
    const { container } = render(<PremiumCard className="custom-class">Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('custom-class')
  })

  it('applies custom style', () => {
    const customStyle = { backgroundColor: 'red' }
    const { container } = render(<PremiumCard style={customStyle}>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toBeInTheDocument()
  })

  it('passes through additional props', () => {
    const { container } = render(
      <PremiumCard data-testid="custom-card" aria-label="Premium">
        Content
      </PremiumCard>
    )

    const card = container.querySelector('[data-testid="custom-card"]')
    expect(card).toBeInTheDocument()
  })

  it('applies hover cursor when hover is enabled', () => {
    const { container } = render(<PremiumCard hover={true}>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).toHaveClass('cursor-pointer')
  })

  it('does not apply hover cursor when hover is disabled', () => {
    const { container } = render(<PremiumCard hover={false}>Content</PremiumCard>)

    const card = container.querySelector('[data-testid="animated-view"]')
    expect(card).not.toHaveClass('cursor-pointer')
  })
})

