/**
 * Notification Filters Component
 * 
 * Filter and view controls for notifications
 */

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SlidersHorizontal, List, SquaresFour } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { NotificationFilter, NotificationView } from '../types'

export interface NotificationFiltersProps {
  filter: NotificationFilter
  view: NotificationView
  categories: Array<{ value: string; label: string; count: number }>
  selectedCategory: string
  unreadCount: number
  onFilterChange: (filter: NotificationFilter) => void
  onViewChange: (view: NotificationView) => void
  onCategoryChange: (category: string) => void
  onShowSettings: () => void
}

export function NotificationFilters({
  filter,
  view,
  categories,
  selectedCategory,
  unreadCount,
  onFilterChange,
  onViewChange,
  onCategoryChange,
  onShowSettings
}: NotificationFiltersProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(value) => { onFilterChange(value as NotificationFilter); }}>
          <TabsList>
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { onViewChange(view === 'grouped' ? 'list' : 'grouped'); }}
            className={cn(view === 'grouped' && 'bg-primary/10')}
          >
            {view === 'grouped' ? <SquaresFour size={20} /> : <List size={20} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowSettings}
          >
            <SlidersHorizontal size={20} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => { onCategoryChange(category.value); }}
          >
            {category.label}
            {category.count > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                {category.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
