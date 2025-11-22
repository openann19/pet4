import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdoptionApplicationReview from '../AdoptionApplicationReview';
import { adoptionApi } from '@/api/adoption-api';
import type { AdoptionApplication, AdoptionProfile } from '@/lib/adoption-types';

vi.mock('@/api/adoption-api', () => ({
  adoptionApi: {
    getAllApplications: vi.fn(),
    getAdoptionProfiles: vi.fn(),
    updateApplicationStatus: vi.fn(),
    updateProfileStatus: vi.fn(),
  },
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@petspark/motion', () => {
  const MotionView = ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );

  return {
    MotionView,
  };
});

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
  useStaggeredItem: () => ({
    kind: 'layout',
    animatedStyle: {},
    opacity: { value: 1 },
    y: { value: 0 },
    itemStyle: {},
  }),
}));

vi.mock('@/effects/reanimated/use-expand-collapse', () => ({
  useExpandCollapse: () => ({
    heightStyle: {},
    opacityStyle: {},
  }),
}));

vi.mock('@/effects/reanimated/use-rotation', () => ({
  useRotation: () => ({
    rotation: { value: 0 },
    rotationStyle: {},
  }),
}));

const mockAdoptionApi = vi.mocked(adoptionApi);

const makeApplication = (overrides: Partial<AdoptionApplication> = {}): AdoptionApplication => ({
  _id: 'app-1',
  adoptionProfileId: 'profile-1',
  applicantId: 'user-1',
  applicantName: 'Alice Adopter',
  applicantEmail: 'alice@example.com',
  applicantPhone: '123-456-7890',
  householdType: 'house',
  hasYard: true,
  hasOtherPets: false,
  hasChildren: false,
  experience: 'Experienced with rescue pets.',
  reason: 'Looking for a companion.',
  status: 'pending',
  submittedAt: new Date().toISOString(),
  ...overrides,
});

const makeProfile = (overrides: Partial<AdoptionProfile> = {}): AdoptionProfile => ({
  _id: 'profile-1',
  petId: 'pet-1',
  petName: 'Buddy',
  petPhoto: 'https://example.com/buddy.jpg',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male',
  size: 'large',
  location: 'Test City',
  shelterId: 'shelter-1',
  shelterName: 'Happy Tails Shelter',
  status: 'available',
  description: 'Friendly dog',
  healthStatus: 'Healthy',
  vaccinated: true,
  spayedNeutered: true,
  goodWithKids: true,
  goodWithPets: true,
  energyLevel: 'medium',
  adoptionFee: 100,
  postedDate: new Date().toISOString(),
  personality: ['Playful'],
  photos: [],
  contactEmail: 'shelter@example.com',
  ...overrides,
});

describe('AdoptionApplicationReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const applications: AdoptionApplication[] = [makeApplication()];
    const profiles: AdoptionProfile[] = [makeProfile()];

    mockAdoptionApi.getAllApplications.mockResolvedValue(applications);
    mockAdoptionApi.getAdoptionProfiles.mockResolvedValue({
      profiles,
      hasMore: false,
    });
  });

  it('loads and displays adoption applications and stats', async () => {
    render(<AdoptionApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('Adoption Applications')).toBeInTheDocument();
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens review dialog and approves an application', async () => {
    const user = userEvent.setup();

    const applications: AdoptionApplication[] = [makeApplication()];
    const profiles: AdoptionProfile[] = [makeProfile()];
    mockAdoptionApi.getAllApplications.mockResolvedValue(applications);
    mockAdoptionApi.getAdoptionProfiles.mockResolvedValue({
      profiles,
      hasMore: false,
    });

    render(<AdoptionApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('Alice Adopter')).toBeInTheDocument();
    });

    const reviewButton = screen.getByRole('button', { name: /approve/i });
    await user.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/approve application/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /approve application/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAdoptionApi.updateApplicationStatus).toHaveBeenCalledWith('app-1', {
        status: 'approved',
      });
      expect(mockAdoptionApi.updateProfileStatus).toHaveBeenCalledWith('profile-1', 'pending');
    });
  });

  it('opens review dialog and rejects an application', async () => {
    const user = userEvent.setup();

    render(<AdoptionApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('Alice Adopter')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText(/reject application/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /reject application/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAdoptionApi.updateApplicationStatus).toHaveBeenCalledWith('app-1', {
        status: 'rejected',
      });
    });
  });

  it('filters applications by search query', async () => {
    const user = userEvent.setup();

    const apps: AdoptionApplication[] = [
      makeApplication(),
      makeApplication({
        _id: 'app-2',
        applicantName: 'Bob Barker',
        applicantEmail: 'bob@example.com',
      }),
    ];

    mockAdoptionApi.getAllApplications.mockResolvedValue(apps);

    render(<AdoptionApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('Alice Adopter')).toBeInTheDocument();
      expect(screen.getByText('Bob Barker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by applicant name/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'Bob');

    await waitFor(() => {
      expect(screen.getByText('Bob Barker')).toBeInTheDocument();
      expect(screen.queryByText('Alice Adopter')).not.toBeInTheDocument();
    });
  });
});
