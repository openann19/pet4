import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePets, usePet, useCreatePet, useUpdatePet, useDeletePet } from '../use-pets';
import { petAPI } from '@/lib/api-services';

vi.mock('@/lib/api-services', () => ({
  petAPI: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch pets', async () => {
    const mockPets = [
      { id: 'pet-1', name: 'Fluffy', species: 'dog' },
      { id: 'pet-2', name: 'Buddy', species: 'cat' },
    ];

    vi.mocked(petAPI.list).mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHook(() => usePets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPets);
    expect(petAPI.list).toHaveBeenCalled();
  });

  it('should fetch pets with params', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];

    vi.mocked(petAPI.list).mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHook(() => usePets({ ownerId: 'user-1' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(petAPI.list).toHaveBeenCalledWith({ ownerId: 'user-1' });
  });
});

describe('usePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch pet by ID', async () => {
    const mockPet = { id: 'pet-1', name: 'Fluffy', species: 'dog' };

    vi.mocked(petAPI.getById).mockResolvedValue(mockPet as never);

    const { result } = renderHook(() => usePet('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPet);
    expect(petAPI.getById).toHaveBeenCalledWith('pet-1');
  });

  it('should not fetch when ID is null', () => {
    const { result } = renderHook(() => usePet(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(petAPI.getById).not.toHaveBeenCalled();
  });
});

describe('useCreatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create pet', async () => {
    const mockPet = { id: 'pet-1', name: 'Fluffy', species: 'dog' };
    const createData = { name: 'Fluffy', species: 'dog' };

    vi.mocked(petAPI.create).mockResolvedValue(mockPet as never);

    const { result } = renderHook(() => useCreatePet(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(createData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(petAPI.create).toHaveBeenCalledWith(createData);
  });
});

describe('useUpdatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update pet', async () => {
    const mockPet = { id: 'pet-1', name: 'Updated Fluffy', species: 'dog' };
    const updateData = { name: 'Updated Fluffy' };

    vi.mocked(petAPI.update).mockResolvedValue(mockPet as never);

    const { result } = renderHook(() => useUpdatePet(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: 'pet-1',
      data: updateData,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(petAPI.update).toHaveBeenCalledWith('pet-1', updateData);
  });
});

describe('useDeletePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete pet', async () => {
    vi.mocked(petAPI.delete).mockResolvedValue({ success: true } as never);

    const { result } = renderHook(() => useDeletePet(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('pet-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(petAPI.delete).toHaveBeenCalledWith('pet-1');
  });
});
