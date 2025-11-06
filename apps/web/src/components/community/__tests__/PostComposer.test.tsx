/**
 * PostComposer tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostComposer } from '@/components/community/PostComposer'

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    createPost: vi.fn().mockResolvedValue({ id: 'post-1' }),
  },
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
    light: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    impact: vi.fn(),
    selection: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/lib/image-upload', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}))

vi.mock('@/lib/video-compression', () => ({
  VideoCompressor: {
    compress: vi.fn(),
    formatFileSize: vi.fn((size) => `${size}MB`),
  },
}))

vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn(() => [[]]),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock spark.user()
global.spark = {
  user: vi.fn().mockResolvedValue({ id: 'user-1', login: 'testuser', avatarUrl: 'https://example.com/avatar.jpg' }),
} as any

describe('PostComposer', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnPostCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <PostComposer
        open={false}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    expect(screen.queryByPlaceholderText(/what's on your mind/i)).not.toBeInTheDocument()
  })

  it('should allow typing text', async () => {
    const user = userEvent.setup()
    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    const textarea = screen.getByPlaceholderText(/what's on your mind/i)
    await user.type(textarea, 'Test post content')

    expect(textarea).toHaveValue('Test post content')
  })

  it('should show character count', async () => {
    const user = userEvent.setup()
    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    const textarea = screen.getByPlaceholderText(/what's on your mind/i)
    await user.type(textarea, 'Test')

    expect(screen.getByText(/996/i)).toBeInTheDocument() // 1000 - 4 = 996
  })

  it('should submit post with text', async () => {
    const user = userEvent.setup()
    const { communityAPI } = await import('@/api/community-api')
    const { toast } = await import('sonner')

    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    const textarea = screen.getByPlaceholderText(/what's on your mind/i)
    await user.type(textarea, 'Test post content')

    const submitButton = screen.getByRole('button', { name: /post/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(communityAPI.createPost).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalled()
      expect(mockOnPostCreated).toHaveBeenCalled()
    })
  })

  it('should disable submit when text is empty', () => {
    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    const submitButton = screen.getByRole('button', { name: /post/i })
    expect(submitButton).toBeDisabled()
  })

  it('should close dialog on close', async () => {
    const user = userEvent.setup()
    render(
      <PostComposer
        open={true}
        onOpenChange={mockOnOpenChange}
        onPostCreated={mockOnPostCreated}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})

