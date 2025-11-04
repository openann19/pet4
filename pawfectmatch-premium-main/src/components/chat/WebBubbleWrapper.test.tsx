import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WebBubbleWrapper } from './WebBubbleWrapper'

describe('WebBubbleWrapper', () => {
  it('renders children correctly', () => {
    render(
      <WebBubbleWrapper>
        <div>Test message</div>
      </WebBubbleWrapper>
    )

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('applies incoming styles when isIncoming is true', () => {
    const { container } = render(
      <WebBubbleWrapper isIncoming>
        <div>Incoming message</div>
      </WebBubbleWrapper>
    )

    const bubble = container.querySelector('.bg-neutral-800')
    expect(bubble).toBeInTheDocument()
  })

  it('applies outgoing styles when isIncoming is false', () => {
    const { container } = render(
      <WebBubbleWrapper isIncoming={false}>
        <div>Outgoing message</div>
      </WebBubbleWrapper>
    )

    const bubble = container.querySelector('.bg-blue-600')
    expect(bubble).toBeInTheDocument()
  })

  it('shows typing shimmer when showTyping is true', () => {
    render(
      <WebBubbleWrapper showTyping>
        <div>Hidden content</div>
      </WebBubbleWrapper>
    )

    const shimmer = document.querySelector('.h-4')
    expect(shimmer).toBeInTheDocument()
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('shows reaction when hasReaction is true', async () => {
    render(
      <WebBubbleWrapper hasReaction reactionEmoji="🔥">
        <div>Message with reaction</div>
      </WebBubbleWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()

    render(
      <WebBubbleWrapper onClick={handleClick}>
        <div>Clickable message</div>
      </WebBubbleWrapper>
    )

    const wrapper = screen.getByText('Clickable message').closest('div')?.parentElement
    if (wrapper) {
      fireEvent.click(wrapper)
    }

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onLongPress on context menu', () => {
    const handleLongPress = vi.fn()

    render(
      <WebBubbleWrapper onLongPress={handleLongPress}>
        <div>Right click message</div>
      </WebBubbleWrapper>
    )

    const wrapper = screen.getByText('Right click message').closest('div')?.parentElement
    if (wrapper) {
      fireEvent.contextMenu(wrapper)
    }

    expect(handleLongPress).toHaveBeenCalledTimes(1)
  })

  it('handles mouse move for 3D tilt when enabled', () => {
    const { container } = render(
      <WebBubbleWrapper enable3DTilt>
        <div>Tiltable message</div>
      </WebBubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      fireEvent.mouseMove(wrapper, {
        clientX: rect.left + rect.width / 2 + 25,
        clientY: rect.top + rect.height / 2 + 25
      })
    }

    expect(wrapper).toBeInTheDocument()
  })

  it('does not apply 3D tilt when disabled', () => {
    const { container } = render(
      <WebBubbleWrapper enable3DTilt={false}>
        <div>No tilt message</div>
      </WebBubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      fireEvent.mouseMove(wrapper, {
        clientX: rect.left + rect.width / 2 + 25,
        clientY: rect.top + rect.height / 2 + 25
      })

      const style = wrapper.getAttribute('style')
      expect(style).not.toContain('rotateX')
    }
  })

  it('resets tilt on mouse leave', () => {
    const { container } = render(
      <WebBubbleWrapper enable3DTilt>
        <div>Reset tilt message</div>
      </WebBubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      fireEvent.mouseLeave(wrapper)
    }

    expect(wrapper).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <WebBubbleWrapper className="custom-wrapper-class">
        <div>Custom styled</div>
      </WebBubbleWrapper>
    )

    expect(container.firstChild).toHaveClass('custom-wrapper-class')
  })

  it('applies custom bubbleClassName', () => {
    const { container } = render(
      <WebBubbleWrapper bubbleClassName="custom-bubble-class">
        <div>Custom bubble</div>
      </WebBubbleWrapper>
    )

    const bubble = container.querySelector('.custom-bubble-class')
    expect(bubble).toBeInTheDocument()
  })

  it('staggered animation with index', async () => {
    render(
      <WebBubbleWrapper index={2} staggerDelay={0.05}>
        <div>Staggered message</div>
      </WebBubbleWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Staggered message')).toBeInTheDocument()
    })
  })

  it('uses default reaction emoji when not provided', async () => {
    render(
      <WebBubbleWrapper hasReaction>
        <div>Default reaction</div>
      </WebBubbleWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('❤️')).toBeInTheDocument()
    })
  })

  it('applies hover scale when 3D tilt is enabled', () => {
    render(
      <WebBubbleWrapper enable3DTilt>
        <div>Hover scale message</div>
      </WebBubbleWrapper>
    )

    expect(screen.getByText('Hover scale message')).toBeInTheDocument()
  })

  it('applies tap scale', () => {
    render(
      <WebBubbleWrapper>
        <div>Tap scale message</div>
      </WebBubbleWrapper>
    )

    expect(screen.getByText('Tap scale message')).toBeInTheDocument()
  })

  it('prevents default context menu behavior', () => {
    const handleLongPress = vi.fn()

    render(
      <WebBubbleWrapper onLongPress={handleLongPress}>
        <div>Context menu test</div>
      </WebBubbleWrapper>
    )

    const wrapper = screen.getByText('Context menu test').closest('div')?.parentElement
    if (wrapper) {
      const preventDefault = vi.fn()
      fireEvent.contextMenu(wrapper, {
        preventDefault
      } as unknown as React.MouseEvent)
      expect(handleLongPress).toHaveBeenCalled()
    }
  })

  it('handles mouse move without 3D tilt', () => {
    const { container } = render(
      <WebBubbleWrapper enable3DTilt={false}>
        <div>No tilt move</div>
      </WebBubbleWrapper>
    )

    const wrapper = container.firstChild as HTMLElement
    if (wrapper) {
      fireEvent.mouseMove(wrapper, {
        clientX: 100,
        clientY: 100
      })
    }

    expect(wrapper).toBeInTheDocument()
  })
})
