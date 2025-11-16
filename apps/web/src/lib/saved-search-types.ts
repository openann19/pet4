import type { DiscoveryPreferences } from '@/components/discovery-preferences';

export interface SavedSearch {
  id: string;
  name: string;
  icon?: string;
  preferences: DiscoveryPreferences;
  isPinned: boolean;
  useCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}
