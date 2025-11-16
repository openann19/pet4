import { useMapConfig } from '@/lib/maps/useMapConfig';

export interface CategoryFiltersProps {
  selectedCategory: string | null;
  onCategoryFilter: (categoryId: string) => void;
}

export function CategoryFilters({
  selectedCategory,
  onCategoryFilter,
}: CategoryFiltersProps): React.JSX.Element {
  const { PLACE_CATEGORIES } = useMapConfig();

  return (
    <div className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
      {PLACE_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryFilter(category.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground shadow-md scale-105'
              : 'bg-background/50 text-foreground/70 hover:bg-muted'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}

