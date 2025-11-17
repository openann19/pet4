import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePetDiscovery } from '../usePetDiscovery';
import { useStorage } from '@/hooks/use-storage';
import { calculateCompatibility } from '@/lib/matching';
import { calculateDistance } from '@/lib/distance';

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(),
}));

vi.mock('@/lib/matching', () => ({
  calculateCompatibility: vi.fn(() => 85),
}));

vi.mock('@/lib/distance', () => ({
  calculateDistance: vi.fn(() => 5.2),
}));

describe('usePetDiscovery', () => {
  const mockPets = [
    {
      id: 'pet-1',
      name: 'Fluffy',
      breed: 'Golden Retriever',
      age: 3,
      gender: 'male' as const,
      size: 'large' as const,
      photo: 'https://example.com/pet1.jpg',
      photos: ['https://example.com/pet1.jpg'],
      bio: 'Friendly dog',
      personality: ['friendly'],
      interests: ['fetch'],
      lookingFor: ['playdates'],
      ownerId: 'owner-1',
      ownerName: 'Owner',
      verified: false,
      createdAt: new Date().toISOString(),
      location: '40.7128,-74.0060',
    },
    {
      id: 'pet-2',
      name: 'Buddy',
      breed: 'Persian',
      age: 2,
      gender: 'male' as const,
      size: 'small' as const,
      photo: 'https://example.com/pet2.jpg',
      photos: ['https://example.com/pet2.jpg'],
      bio: 'Calm cat',
      personality: ['calm'],
      interests: ['napping'],
      lookingFor: ['companionship'],
      ownerId: 'owner-2',
      ownerName: 'Owner 2',
      verified: false,
      createdAt: new Date().toISOString(),
      location: '40.7580,-73.9855',
    },
  ];

  const mockUserPet = {
    id: 'user-pet-1',
    name: 'My Pet',
    breed: 'Labrador',
    age: 4,
    gender: 'female' as const,
    size: 'medium' as const,
    photo: 'https://example.com/user-pet.jpg',
    photos: ['https://example.com/user-pet.jpg'],
    bio: 'My pet',
    personality: ['energetic'],
    interests: ['running'],
    lookingFor: ['friends'],
    ownerId: 'user-1',
    ownerName: 'Me',
    verified: true,
    createdAt: new Date().toISOString(),
    location: '40.7128,-74.0060',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStorage).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') return [mockPets, vi.fn(), vi.fn()];
      if (key === 'swipe-history') return [[], vi.fn(), vi.fn()];
      if (key === 'adoptable-pet-ids') return [new Set(), vi.fn(), vi.fn()];
      return [defaultValue, vi.fn(), vi.fn()];
    });
  });

  it('should return available pets', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    expect(result.current.availablePets.length).toBeGreaterThan(0);
  });

  it('should filter out swiped pets', () => {
    const swipedIds = new Set(['pet-1']);

    vi.mocked(useStorage).mockImplementation((key: string) => {
      if (key === 'all-pets') return [mockPets, vi.fn(), vi.fn()];
      if (key === 'swipe-history') return [[], vi.fn(), vi.fn()];
      if (key === 'adoptable-pet-ids') return [new Set(), vi.fn(), vi.fn()];
      return [[], vi.fn(), vi.fn()];
    });

    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
        swipedPetIds: swipedIds,
      })
    );

    expect(result.current.availablePets.find((p) => p.id === 'pet-1')).toBeUndefined();
  });

  it('should filter by preferences', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
        preferences: {
          minAge: 3,
          maxAge: 5,
        },
      })
    );

    expect(result.current.availablePets.every((p) => p.age >= 3 && p.age <= 5)).toBe(true);
  });

  it('should calculate compatibility scores', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    expect(calculateCompatibility).toHaveBeenCalled();
  });

  it('should calculate distances', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    expect(calculateDistance).toHaveBeenCalled();
  });

  it('should navigate to next pet', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    const initialIndex = result.current.currentIndex;
    act(() => {
      result.current.nextPet();
    });

    expect(result.current.currentIndex).toBe(initialIndex + 1);
  });

  it('should navigate to previous pet', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    act(() => {
      result.current.nextPet();
      result.current.nextPet();
      result.current.prevPet();
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('should get current pet', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    expect(result.current.currentPet).toBeDefined();
  });

  it('should reset to first pet', () => {
    const { result } = renderHook(() =>
      usePetDiscovery({
        userPet: mockUserPet,
      })
    );

    act(() => {
      result.current.nextPet();
      result.current.nextPet();
      result.current.reset();
    });

    expect(result.current.currentIndex).toBe(0);
  });
});
