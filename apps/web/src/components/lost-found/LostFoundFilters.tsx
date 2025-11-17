import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { LostAlert } from '@/lib/lost-found-types';

interface LostFoundFiltersProps {
  activeTab: 'all' | 'active' | 'found' | 'favorites';
  onTabChange: (tab: 'all' | 'active' | 'found' | 'favorites') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  alerts: LostAlert[];
  favorites: string[];
  t: {
    lostFound?: {
      searchPlaceholder?: string;
    };
  };
}

export function LostFoundFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  alerts,
  favorites,
  t,
}: LostFoundFiltersProps) {
  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const foundCount = alerts.filter((a) => a.status === 'found').length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 relative w-full">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          placeholder={
            t.lostFound?.searchPlaceholder ??
            'Search by pet name, breed, location...'
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search lost and found alerts"
          className="pl-10"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="all">
            All {alerts.length > 0 && `(${alerts.length})`}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active {activeCount > 0 && `(${activeCount})`}
          </TabsTrigger>
          <TabsTrigger value="found">
            Found {foundCount > 0 && `(${foundCount})`}
          </TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites{' '}
            {Array.isArray(favorites) && favorites.length > 0 && `(${favorites.length})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

