import { render, fireEvent } from '@testing-library/react-native'
import SaveToHighlightDialog from './SaveToHighlightDialog'
import type { Story } from '@shared/types'

describe('SaveToHighlightDialog (mobile)', () => {
  const mockStory: Story = {
    id: 'story-1',
    userId: 'user-1',
    userName: 'User',
    petId: 'pet-1',
    petName: 'Buddy',
    petPhoto: '',
    type: 'photo',
    mediaUrl: 'https://example.com/photo.jpg',
    duration: 5,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    visibility: 'everyone',
    viewCount: 0,
    views: [],
    reactions: [],
  }

  it('renders dialog and allows creating a new highlight', () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const { getByText, getByPlaceholderText } = render(
      <SaveToHighlightDialog visible={true} onClose={onClose} story={mockStory} onSaved={onSaved} />
    )

    expect(getByText('Save to Highlight')).toBeTruthy()
    fireEvent.press(getByText('New Highlight'))
    expect(getByPlaceholderText('Highlight Name')).toBeTruthy()
    fireEvent.changeText(getByPlaceholderText('Highlight Name'), 'My Highlight')
    fireEvent.press(getByText('Create Highlight'))
    // Should call onSaved and onClose
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not create highlight with empty title', () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const { getByText, getByPlaceholderText } = render(
      <SaveToHighlightDialog visible={true} onClose={onClose} story={mockStory} onSaved={onSaved} />
    )
    fireEvent.press(getByText('New Highlight'))
    fireEvent.changeText(getByPlaceholderText('Highlight Name'), '')
    fireEvent.press(getByText('Create Highlight'))
    expect(onSaved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
