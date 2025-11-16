import { describe, it, expect } from 'vitest';
import { filterAlerts } from '../filter-alerts';
import type { LostAlert } from '@/lib/lost-found-types';

const createMockAlert = (overrides: Partial<LostAlert> = {}): LostAlert => ({
  id: 'alert-1',
  status: 'active',
  createdAt: new Date().toISOString(),
  petSummary: {
    name: 'Fluffy',
    species: 'cat',
    breed: 'Persian',
  },
  lastSeen: {
    description: 'Near the park',
  },
  ...overrides,
});

describe('filterAlerts', () => {
  it('should return all alerts when no filters applied', () => {
    const alerts = [
      createMockAlert({ id: 'alert-1' }),
      createMockAlert({ id: 'alert-2' }),
    ];

    const result = filterAlerts({
      alerts,
      activeTab: 'all',
      searchQuery: '',
      favorites: [],
    });

    expect(result).toHaveLength(2);
  });

  it('should filter by favorites tab', () => {
    const alerts = [
      createMockAlert({ id: 'alert-1' }),
      createMockAlert({ id: 'alert-2' }),
    ];

    const result = filterAlerts({
      alerts,
      activeTab: 'favorites',
      searchQuery: '',
      favorites: ['alert-1'],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alert-1');
  });

  it('should filter by search query', () => {
    const alerts = [
      createMockAlert({ id: 'alert-1', petSummary: { name: 'Fluffy', species: 'cat' } }),
      createMockAlert({ id: 'alert-2', petSummary: { name: 'Max', species: 'dog' } }),
    ];

    const result = filterAlerts({
      alerts,
      activeTab: 'all',
      searchQuery: 'Fluffy',
      favorites: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alert-1');
  });

  it('should filter by breed in search query', () => {
    const alerts = [
      createMockAlert({
        id: 'alert-1',
        petSummary: { name: 'Fluffy', species: 'cat', breed: 'Persian' },
      }),
      createMockAlert({
        id: 'alert-2',
        petSummary: { name: 'Max', species: 'dog', breed: 'Labrador' },
      }),
    ];

    const result = filterAlerts({
      alerts,
      activeTab: 'all',
      searchQuery: 'Persian',
      favorites: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alert-1');
  });

  it('should sort by creation date descending', () => {
    const now = new Date();
    const alerts = [
      createMockAlert({
        id: 'alert-1',
        createdAt: new Date(now.getTime() - 1000).toISOString(),
      }),
      createMockAlert({
        id: 'alert-2',
        createdAt: new Date(now.getTime() - 2000).toISOString(),
      }),
      createMockAlert({
        id: 'alert-3',
        createdAt: now.toISOString(),
      }),
    ];

    const result = filterAlerts({
      alerts,
      activeTab: 'all',
      searchQuery: '',
      favorites: [],
    });

    expect(result[0].id).toBe('alert-3');
    expect(result[1].id).toBe('alert-1');
    expect(result[2].id).toBe('alert-2');
  });
});

