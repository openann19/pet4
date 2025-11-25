import type { LostAlert } from '@/lib/lost-found-types';

interface FilterAlertsOptions {
  alerts: LostAlert[];
  activeTab: 'all' | 'active' | 'found' | 'favorites';
  searchQuery: string;
  favorites: string[];
}

export function filterAlerts({
  alerts,
  activeTab,
  searchQuery,
  favorites,
}: FilterAlertsOptions): LostAlert[] {
  let list = alerts;

  if (activeTab === 'favorites') {
    list = list.filter((a) => Array.isArray(favorites) && favorites.includes(a.id));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    list = list.filter(
      (a) =>
        a.petSummary.name.toLowerCase().includes(query) ||
        (a.petSummary.breed?.toLowerCase().includes(query) ?? false) ||
        a.petSummary.species.toLowerCase().includes(query) ||
        (a.lastSeen.description?.toLowerCase().includes(query) ?? false)
    );
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
