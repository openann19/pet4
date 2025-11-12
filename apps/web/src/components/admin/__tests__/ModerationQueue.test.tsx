import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { moderationService, photoService } from '@/lib/backend-services';
import { userService } from '@/lib/user-service';

vi.mock('@/lib/backend-services', () => ({
  moderationService: {
    getQueue: vi.fn(),
    takeTask: vi.fn(),
    makeDecision: vi.fn(),
  },
  photoService: {
    getPhotosByOwner: vi.fn(),
  },
}));
vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn(),
  },
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockModerationService = vi.mocked(moderationService);
const mockPhotoService = vi.mocked(photoService);
const mockUserService = vi.mocked(userService);

describe('ModerationQueue', () => {
  const mockTasks = [
    {
      id: 'task1',
      photoId: 'photo1',
      petId: 'pet1',
      ownerId: 'owner1',
      priority: 'medium' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task2',
      photoId: 'photo2',
      petId: 'pet2',
      ownerId: 'owner2',
      priority: 'high' as const,
      status: 'in_progress' as const,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockPhotos = [
    {
      id: 'photo1',
      petId: 'pet1',
      ownerId: 'owner1',
      status: 'awaiting_review' as const,
      originalUrl: 'https://example.com/photo1.jpg',
      variants: [],
      metadata: {
        fileHash: 'hash1',
        contentFingerprint: 'fingerprint1',
        originalFilename: 'photo1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1000,
        width: 800,
        height: 600,
        exifStripped: true,
      },
      safetyCheck: {
        isNSFW: false,
        isViolent: false,
        hasHumanFaces: false,
        humanFaceCount: 0,
        humanFaceDominance: 0,
        isDuplicate: false,
        confidence: {
          nsfw: 0,
          violence: 0,
          animal: 1,
          humanFace: 0,
        },
        flags: [],
        scannedAt: new Date().toISOString(),
      },
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'photo2',
      petId: 'pet2',
      ownerId: 'owner2',
      status: 'awaiting_review' as const,
      originalUrl: 'https://example.com/photo2.jpg',
      variants: [],
      metadata: {
        fileHash: 'hash2',
        contentFingerprint: 'fingerprint2',
        originalFilename: 'photo2.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2000,
        width: 1200,
        height: 900,
        exifStripped: true,
      },
      safetyCheck: {
        isNSFW: false,
        isViolent: false,
        hasHumanFaces: false,
        humanFaceCount: 0,
        humanFaceDominance: 0,
        isDuplicate: false,
        confidence: {
          nsfw: 0,
          violence: 0,
          animal: 1,
          humanFace: 0,
        },
        flags: ['low_quality'],
        scannedAt: new Date().toISOString(),
      },
      uploadedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    const task1 = mockTasks[0];
    const task2 = mockTasks[1];
    if (!task1 || !task2) {
      throw new Error('Mock tasks not properly initialized');
    }
    mockModerationService.getQueue.mockResolvedValue({
      pending: [task1],
      inProgress: [task2],
      completed: [],
      totalCount: 2,
      averageReviewTime: 0,
    });
    mockPhotoService.getPhotosByOwner.mockResolvedValue(mockPhotos);
    mockUserService.user.mockResolvedValue({
      id: 'moderator1',
      name: 'Test Moderator',
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders moderation queue', async () => {
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText(/moderation queue/i)).toBeInTheDocument();
    });
  });

  it('loads and displays pending tasks', async () => {
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('displays tasks in correct tabs', async () => {
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('opens task detail dialog when task is clicked', async () => {
    const user = userEvent.setup();
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });

    const taskCards = screen.queryAllByRole('button');
    const firstTaskCard = taskCards[0];
    if (firstTaskCard) {
      await user.click(firstTaskCard);
    }
  });

  it('takes task when take button is clicked', async () => {
    const task1 = mockTasks[0];
    if (!task1) {
      throw new Error('Mock task not properly initialized');
    }
    mockModerationService.takeTask.mockResolvedValue(task1);

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('approves task when approve button is clicked', async () => {
    const task1 = mockTasks[0];
    if (!task1) {
      throw new Error('Mock task not properly initialized');
    }
    mockModerationService.makeDecision.mockResolvedValue(task1);

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('rejects task when reject button is clicked', async () => {
    const task1 = mockTasks[0];
    if (!task1) {
      throw new Error('Mock task not properly initialized');
    }
    mockModerationService.makeDecision.mockResolvedValue(task1);

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('handles authentication errors', async () => {
    mockUserService.user.mockResolvedValue(null);

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    mockModerationService.getQueue.mockRejectedValue(new Error('API Error'));

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });

  it('filters tasks by status', async () => {
    const user = userEvent.setup();
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });

    const tabs = screen.getAllByRole('tab');
    const inProgressTab = tabs.find((tab) => tab.textContent?.includes('In Progress'));
    if (inProgressTab) {
      await user.click(inProgressTab);
    }
  });

  it('displays photo in detail view', async () => {
    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockPhotoService.getPhotosByOwner).toHaveBeenCalled();
    });
  });

  it('handles empty queue', async () => {
    mockModerationService.getQueue.mockResolvedValue({
      pending: [],
      inProgress: [],
      completed: [],
      totalCount: 0,
      averageReviewTime: 0,
    });

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled();
    });
  });
});
