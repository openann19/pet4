import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQueryClient } from '@/test-utils/react-query';
import { usePets, usePet, useCreatePet, useUpdatePet, useDeletePet } from '../use-pets';
import { petAPI } from '@/lib/api-services';

const mockedPetAPI = vi.mocked(petAPI);

vi.mock('@/lib/api-services', () => ({
  petAPI: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usePets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch pets', async () => {
    const mockPets = [
      { id: 'pet-1', name: 'Fluffy', species: 'dog' },
      { id: 'pet-2', name: 'Buddy', species: 'cat' },
    ];

    mockedPetAPI.list.mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHookWithQueryClient(() => usePets());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPets);
    expect(mockedPetAPI.list.mock.calls.length).toBeGreaterThan(0);
  });

  it('should fetch pets with params', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];

    mockedPetAPI.list.mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHookWithQueryClient(() => usePets({ ownerId: 'user-1' }));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedPetAPI.list.mock.calls[0]).toEqual([{ ownerId: 'user-1' }]);
  });
});

describe('usePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch pet by ID', async () => {
    const mockPet = { id: 'pet-1', name: 'Fluffy', species: 'dog' };

    mockedPetAPI.getById.mockResolvedValue(mockPet as never);

    const { result } = renderHookWithQueryClient(() => usePet('pet-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPet);
    expect(mockedPetAPI.getById.mock.calls[0]).toEqual(['pet-1']);
  });

  it('should not fetch when ID is null', () => {
    const { result } = renderHookWithQueryClient(() => usePet(null));

    expect(result.current.isFetching).toBe(false);
    expect(mockedPetAPI.getById.mock.calls.length).toBe(0);
  });
});

describe('useCreatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create pet', async () => {
    const mockPet = { id: 'pet-1', name: 'Fluffy', species: 'dog' };
    const createData = { name: 'Fluffy', species: 'dog' };

    mockedPetAPI.create.mockResolvedValue(mockPet as never);

    const { result } = renderHookWithQueryClient(() => useCreatePet());

    await result.current.mutateAsync(createData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedPetAPI.create.mock.calls[0]).toEqual([createData]);
  });
});

describe('useUpdatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update pet', async () => {
    const mockPet = { id: 'pet-1', name: 'Updated Fluffy', species: 'dog' };
    const updateData = { name: 'Updated Fluffy' };

    mockedPetAPI.update.mockResolvedValue(mockPet as never);

    const { result } = renderHookWithQueryClient(() => useUpdatePet());

    await result.current.mutateAsync({
      id: 'pet-1',
      data: updateData,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedPetAPI.update.mock.calls[0]).toEqual(['pet-1', updateData]);
  });
});

describe('useDeletePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete pet', async () => {
    mockedPetAPI.delete.mockResolvedValue({ success: true } as never);

    const { result } = renderHookWithQueryClient(() => useDeletePet());

    await result.current.mutateAsync('pet-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedPetAPI.delete.mock.calls[0]).toEqual(['pet-1']);
  });
});
