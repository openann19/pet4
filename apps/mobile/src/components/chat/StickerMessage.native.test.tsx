import { render, screen, fireEvent } from '@testing-library/react-native'
import { StickerMessage } from './StickerMessage.native'
import type { Sticker } from '../../lib/sticker-library'

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
    render(<StickerMessage sticker={mockSticker} testID="sticker" />)
    
    const emoji = screen.getByTestId('sticker-emoji')
    expect(emoji).toBeTruthy()
    expect(emoji.props.children).toBe('😊')
  })

  it('should render with isOwn prop', () => {
    const { rerender } = render(
      <StickerMessage sticker={mockSticker} isOwn={false} testID="sticker" />
    )
    
    let container = screen.getByTestId('sticker')
    expect(container).toBeTruthy()

    rerender(<StickerMessage sticker={mockSticker} isOwn={true} testID="sticker" />)
    container = screen.getByTestId('sticker')
    expect(container).toBeTruthy()
  })

  it('should call onHover when pressed', () => {
    const onHover = vi.fn()
    render(<StickerMessage sticker={mockSticker} onHover={onHover} testID="sticker" />)
    
    const stickerContainer = screen.getByTestId('sticker-sticker')
    fireEvent(stickerContainer, 'pressIn')
    
    expect(onHover).toHaveBeenCalledTimes(1)
  })

  it('should call onPress when pressed', () => {
    const onPress = vi.fn()
    render(<StickerMessage sticker={mockSticker} onPress={onPress} testID="sticker" />)
    
    const stickerContainer = screen.getByTestId('sticker-sticker')
    fireEvent(stickerContainer, 'press')
    
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('should handle sticker without animation', () => {
    const stickerWithoutAnimation: Sticker = {
      id: 'test-sticker-no-anim',
      categoryId: 'happy',
      emoji: '😊',
      label: 'Test Sticker No Anim',
      keywords: ['test']
    }
    
    render(<StickerMessage sticker={stickerWithoutAnimation} testID="sticker" />)
    
    const emoji = screen.getByTestId('sticker-emoji')
    expect(emoji).toBeTruthy()
  })

  it('should handle different animation types', () => {
    const animations: Array<NonNullable<Sticker['animation']>> = [
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
          sticker={{ ...mockSticker, animation }}
          testID="sticker"
        />
      )
      
      const emoji = screen.getByTestId('sticker-emoji')
      expect(emoji).toBeTruthy()
      
      unmount()
    })
  })

  it('should apply custom style', () => {
    const customStyle = { marginTop: 10 }
    render(
      <StickerMessage
        sticker={mockSticker}
        style={customStyle}
        testID="sticker"
      />
    )
    
    const container = screen.getByTestId('sticker')
    expect(container).toBeTruthy()
  })

  it('should use custom testID', () => {
    render(<StickerMessage sticker={mockSticker} testID="custom-sticker" />)
    
    const container = screen.getByTestId('custom-sticker')
    expect(container).toBeTruthy()
    
    const emoji = screen.getByTestId('custom-sticker-emoji')
    expect(emoji).toBeTruthy()
  })
})

