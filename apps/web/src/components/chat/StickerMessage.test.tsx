import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StickerMessage } from './StickerMessage'
import type { Sticker } from '@/lib/sticker-library'
import { isTruthy, isDefined } from '@/core/guards';

const mockSticker: Sticker = {
  id: 'test-sticker',
  categoryId: 'happy',
  emoji: '😊',
  animation: 'bounce',
  label: 'Test Sticker',
  keywords: ['test']
}

describe('StickerMessage', () => {
  it('should render sticker emoji', () => {
    render(<StickerMessage sticker={mockSticker} />)
    
    const emoji = screen.getByText('😊')
    expect(emoji).toBeInTheDocument()
  })

  it('should render with isOwn prop', () => {
    const { container, rerender } = render(
      <StickerMessage sticker={mockSticker} isOwn={false} />
    )
    
    expect(container.firstChild).toBeInTheDocument()

    rerender(<StickerMessage sticker={mockSticker} isOwn={true} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should call onHover when mouse enters', () => {
    const onHover = vi.fn()
    render(<StickerMessage sticker={mockSticker} onHover={onHover} />)
    
    const stickerContainer = screen.getByText('😊').closest('div')
    if (isTruthy(stickerContainer)) {
      fireEvent.mouseEnter(stickerContainer)
    }
    
    expect(onHover).toHaveBeenCalledTimes(1)
  })

  it('should handle sticker without animation', () => {
    const stickerWithoutAnimation: Sticker = {
      ...mockSticker
    }
    delete stickerWithoutAnimation.animation
    
    render(<StickerMessage sticker={stickerWithoutAnimation} />)
    
    const emoji = screen.getByText('😊')
    expect(emoji).toBeInTheDocument()
  })

  it('should handle different animation types', () => {
    const animations: Array<Sticker['animation']> = [
      'bounce',
      'spin',
      'pulse',
      'shake',
      'float',
      'grow',
      'wiggle',
      'flip'
    ]

    animations.forEach((animation) => {
      const { unmount } = render(
        <StickerMessage
          sticker={{ ...mockSticker, animation: animation }}
        />
      )
      
      const emoji = screen.getByText('😊')
      expect(emoji).toBeInTheDocument()
      
      unmount()
    })
  })

  it('should apply hover styles when hovered', () => {
    render(<StickerMessage sticker={mockSticker} />)
    
    const stickerContainer = screen.getByText('😊').closest('div')
    if (isTruthy(stickerContainer)) {
      fireEvent.mouseEnter(stickerContainer)
      expect(stickerContainer).toHaveClass('bg-muted/30')
      
      fireEvent.mouseLeave(stickerContainer)
    }
  })

  it('should handle click events', () => {
    render(<StickerMessage sticker={mockSticker} />)
    
    const stickerContainer = screen.getByText('😊').closest('div')
    if (isTruthy(stickerContainer)) {
      fireEvent.click(stickerContainer)
    }
  })
})

