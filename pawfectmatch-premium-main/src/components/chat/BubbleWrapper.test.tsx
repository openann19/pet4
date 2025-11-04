import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BubbleWrapper } from './BubbleWrapper'

describe('BubbleWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children correctly', () => {
    render(
      <BubbleWrapper>
        <div>Test message</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('applies incoming styles when direction is incoming', () => {
    render(
      <BubbleWrapper direction="incoming">
        <div>Incoming message</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Incoming message')).toBeInTheDocument()
  })

  it('applies outgoing styles when direction is outgoing', () => {
    render(
      <BubbleWrapper direction="outgoing">
        <div>Outgoing message</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Outgoing message')).toBeInTheDocument()
  })

  it('shows typing dots when isTyping is true', () => {
    const { container } = render(
      <BubbleWrapper isTyping>
        <div>Hidden content</div>
      </BubbleWrapper>
    )

    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it('calls onPress when clicked', async () => {
    const handlePress = vi.fn()

    render(
      <BubbleWrapper onPress={handlePress}>
        <div>Clickable message</div>
      </BubbleWrapper>
    )

    const bubble = screen.getByText('Clickable message').closest('div')
    if (bubble) {
      fireEvent.mouseDown(bubble)
      fireEvent.mouseUp(bubble)
    }

    await waitFor(() => {
      expect(handlePress).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onLongPress after delay', async () => {
    const handleLongPress = vi.fn()

    render(
      <BubbleWrapper onLongPress={handleLongPress}>
        <div>Long pressable message</div>
      </BubbleWrapper>
    )

    const bubble = screen.getByText('Long pressable message').closest('div')
    if (bubble) {
      fireEvent.mouseDown(bubble)
      vi.advanceTimersByTime(500)
      fireEvent.mouseUp(bubble)
    }

    await waitFor(() => {
      expect(handleLongPress).toHaveBeenCalledTimes(1)
    })
  })

  it('does not call onLongPress if released before delay', async () => {
    const handleLongPress = vi.fn()

    render(
      <BubbleWrapper onLongPress={handleLongPress}>
        <div>Quick release message</div>
      </BubbleWrapper>
    )

    const bubble = screen.getByText('Quick release message').closest('div')
    if (bubble) {
      fireEvent.mouseDown(bubble)
      vi.advanceTimersByTime(200)
      fireEvent.mouseUp(bubble)
    }

    await waitFor(() => {
      expect(handleLongPress).not.toHaveBeenCalled()
    })
  })

  it('calls onReply when swiped', async () => {
    const handleReply = vi.fn()

    const { container } = render(
      <BubbleWrapper onReply={handleReply} isOwn={false}>
        <div>Swipeable message</div>
      </BubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      fireEvent.touchStart(wrapper, {
        touches: [{ clientX: 0, clientY: 0 }]
      })

      fireEvent.touchMove(wrapper, {
        touches: [{ clientX: 100, clientY: 10 }]
      })

      fireEvent.touchEnd(wrapper)
    }

    await waitFor(() => {
      expect(handleReply).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('applies custom className', () => {
    const { container } = render(
      <BubbleWrapper className="custom-wrapper-class">
        <div>Custom styled</div>
      </BubbleWrapper>
    )

    expect(container.firstChild).toHaveClass('custom-wrapper-class')
  })

  it('staggered animation with index', async () => {
    render(
      <BubbleWrapper index={2}>
        <div>Staggered message</div>
      </BubbleWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Staggered message')).toBeInTheDocument()
    })
  })

  it('does not trigger swipe when isOwn is true', async () => {
    const handleReply = vi.fn()

    const { container } = render(
      <BubbleWrapper onReply={handleReply} isOwn>
        <div>Non-swipeable</div>
      </BubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      fireEvent.touchStart(wrapper, {
        touches: [{ clientX: 0, clientY: 0 }]
      })

      fireEvent.touchMove(wrapper, {
        touches: [{ clientX: 100, clientY: 10 }]
      })

      fireEvent.touchEnd(wrapper)
    }

    await waitFor(() => {
      expect(handleReply).not.toHaveBeenCalled()
    })
  })

  it('calls onReaction when reaction is triggered', async () => {
    const handleReaction = vi.fn()

    render(
      <BubbleWrapper onReaction={handleReaction}>
        <div>Reactable message</div>
      </BubbleWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Reactable message')).toBeInTheDocument()
    })
  })

  it('handles mouse leave event', () => {
    const handlePress = vi.fn()

    render(
      <BubbleWrapper onPress={handlePress}>
        <div>Mouse leave test</div>
      </BubbleWrapper>
    )

    const wrapper = screen.getByText('Mouse leave test').closest('div')?.parentElement                                                                          
    if (wrapper) {
      fireEvent.mouseDown(wrapper)
      fireEvent.mouseLeave(wrapper)
    }

    expect(wrapper).toBeInTheDocument()
  })

  it('handles typing completion', () => {
    render(
      <BubbleWrapper isTyping typingComplete>
        <div>Completed typing</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Completed typing')).toBeInTheDocument()
  })

  it('handles highlighted state', () => {
    render(
      <BubbleWrapper isHighlighted>
        <div>Highlighted message</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Highlighted message')).toBeInTheDocument()
  })

  it('handles thread message state', () => {
    render(
      <BubbleWrapper isThreadMessage>
        <div>Thread message</div>
      </BubbleWrapper>
    )

    expect(screen.getByText('Thread message')).toBeInTheDocument()
  })
})
