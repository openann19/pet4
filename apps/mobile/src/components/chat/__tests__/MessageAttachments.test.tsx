/**
 * MessageAttachments Component Tests (Mobile)
 * Location: apps/mobile/src/components/chat/__tests__/MessageAttachments.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react-native'
import MessageAttachments from '../MessageAttachments'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: (component: unknown) => component,
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => fn()),
  withSpring: vi.fn((value: number) => value),
}))

// Mock Linking
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    Linking: {
      canOpenURL: vi.fn(() => Promise.resolve(true)),
      openURL: vi.fn(() => Promise.resolve()),
    },
  }
})

describe('MessageAttachments (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockVoiceAttachment = {
    id: '1',
    type: 'voice' as const,
    url: 'https://example.com/voice.mp3',
    duration: 120,
    waveform: [0.5, 0.7, 0.3, 0.9, 0.4],
  }

  const mockPhotoAttachment = {
    id: '2',
    type: 'photo' as const,
    url: 'https://example.com/photo.jpg',
    name: 'test-photo.jpg',
  }

  const mockVideoAttachment = {
    id: '3',
    type: 'video' as const,
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
    name: 'test-video.mp4',
  }

  const mockDocumentAttachment = {
    id: '4',
    type: 'document' as const,
    url: 'https://example.com/doc.pdf',
    name: 'test-document.pdf',
    size: 1024 * 1024, // 1 MB
  }

  it('should render voice attachment', () => {
    const { getByLabelText } = render(<MessageAttachments attachments={[mockVoiceAttachment]} />)
    expect(getByLabelText(/play voice message|pause voice message/i)).toBeTruthy()
  })

  it('should render photo attachment', () => {
    const { getByLabelText } = render(<MessageAttachments attachments={[mockPhotoAttachment]} />)
    expect(getByLabelText('Photo attachment')).toBeTruthy()
    expect(getByLabelText('Download photo')).toBeTruthy()
  })

  it('should render video attachment', () => {
    const { getByText } = render(<MessageAttachments attachments={[mockVideoAttachment]} />)
    expect(getByText('test-video.mp4')).toBeTruthy()
  })

  it('should render document attachment', () => {
    const { getByText } = render(<MessageAttachments attachments={[mockDocumentAttachment]} />)
    expect(getByText('test-document.pdf')).toBeTruthy()
    expect(getByText('1.0 MB')).toBeTruthy()
  })

  it('should render multiple attachments', () => {
    const { getByLabelText, getByText } = render(
      <MessageAttachments
        attachments={[mockVoiceAttachment, mockPhotoAttachment, mockVideoAttachment]}
      />
    )
    expect(getByLabelText(/play voice message/i)).toBeTruthy()
    expect(getByLabelText('Photo attachment')).toBeTruthy()
    expect(getByText('test-video.mp4')).toBeTruthy()
  })

  it('should format duration correctly', () => {
    const { getByText } = render(<MessageAttachments attachments={[mockVoiceAttachment]} />)
    expect(getByText('2:00')).toBeTruthy()
  })

  it('should format file size correctly', () => {
    const { getByText } = render(<MessageAttachments attachments={[mockDocumentAttachment]} />)
    expect(getByText('1.0 MB')).toBeTruthy()
  })

  it('should handle missing attachment name gracefully', () => {
    const attachmentWithoutName = {
      id: '5',
      type: 'photo' as const,
      url: 'https://example.com/photo.jpg',
    }
    const { getByLabelText } = render(<MessageAttachments attachments={[attachmentWithoutName]} />)
    expect(getByLabelText('Photo attachment')).toBeTruthy()
  })

  it('should use waveform data when available', () => {
    const { getByLabelText } = render(<MessageAttachments attachments={[mockVoiceAttachment]} />)
    expect(getByLabelText('Audio waveform')).toBeTruthy()
  })
})
