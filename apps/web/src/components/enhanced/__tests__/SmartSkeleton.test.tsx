import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SmartSkeleton, PostSkeleton, CardGridSkeleton, ListSkeleton } from '../SmartSkeleton'

describe('SmartSkeleton', () => {
  it('should render text skeleton by default', () => {
    const { container } = render(<SmartSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render circular skeleton', () => {
    const { container } = render(<SmartSkeleton variant="circular" />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('should render rectangular skeleton', () => {
    const { container } = render(<SmartSkeleton variant="rectangular" />)
    expect(container.firstChild).toHaveClass('rounded-md')
  })

  it('should render card skeleton', () => {
    const { container } = render(<SmartSkeleton variant="card" />)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('should render avatar skeleton', () => {
    const { container } = render(<SmartSkeleton variant="avatar" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render post skeleton', () => {
    const { container } = render(<SmartSkeleton variant="post" />)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('should render multiple skeletons when count > 1', () => {
    const { container } = render(<SmartSkeleton count={3} />)
    const skeletons = container.querySelectorAll('.bg-muted')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('should respect custom width and height', () => {
    const { container } = render(
      <SmartSkeleton width="200px" height="100px" />
    )
    const skeleton = container.firstChild as HTMLElement
    expect(skeleton.style.width).toBe('200px')
    expect(skeleton.style.height).toBe('100px')
  })

  it('should disable animation when animate is false', () => {
    const { container } = render(<SmartSkeleton animate={false} />)
    const shimmer = container.querySelector('.bg-gradient-to-r')
    expect(shimmer).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<SmartSkeleton className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('PostSkeleton', () => {
  it('should render default count of 3', () => {
    const { container } = render(<PostSkeleton />)
    const skeletons = container.querySelectorAll('.rounded-lg')
    expect(skeletons.length).toBe(3)
  })

  it('should render custom count', () => {
    const { container } = render(<PostSkeleton count={5} />)
    const skeletons = container.querySelectorAll('.rounded-lg')
    expect(skeletons.length).toBe(5)
  })
})

describe('CardGridSkeleton', () => {
  it('should render default count of 6', () => {
    const { container } = render(<CardGridSkeleton />)
    const skeletons = container.querySelectorAll('.rounded-lg')
    expect(skeletons.length).toBe(6)
  })

  it('should render custom count', () => {
    const { container } = render(<CardGridSkeleton count={4} />)
    const skeletons = container.querySelectorAll('.rounded-lg')
    expect(skeletons.length).toBe(4)
  })
})

describe('ListSkeleton', () => {
  it('should render default count of 5', () => {
    const { container } = render(<ListSkeleton />)
    const skeletons = container.querySelectorAll('.flex.items-center')
    expect(skeletons.length).toBe(5)
  })

  it('should render custom count', () => {
    const { container } = render(<ListSkeleton count={7} />)
    const skeletons = container.querySelectorAll('.flex.items-center')
    expect(skeletons.length).toBe(7)
  })
})

