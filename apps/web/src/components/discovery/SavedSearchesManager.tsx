'use client';

import { MotionView } from "@petspark/motion";
import { useCallback, useMemo, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import {
  BookmarkSimple,
  Plus,
  X,
  Star,
  Pencil,
  Trash,
  Check,
  FloppyDisk,
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SavedSearch } from '@/lib/saved-search-types';
import type { DiscoveryPreferences } from '@/components/discovery-preferences';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useModalAnimation } from '@/effects/reanimated/use-modal-animation';
import { useExpandCollapse } from '@/effects/reanimated/use-expand-collapse';
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { AnimatedView } from '@/effects/reanimated/animated-view';

const logger = createLogger('SavedSearchesManager');

interface SavedSearchesManagerProps {
  currentPreferences: DiscoveryPreferences;
  onApplySearch: (preferences: DiscoveryPreferences) => void;
  onClose: () => void;
}

interface SearchItemProps {
  search: SavedSearch;
  index: number;
  totalItems: number;
  editingId: string | null;
  searchName: string;
  getPreferencesSummary: (prefs: DiscoveryPreferences) => string;
  onEdit: (id: string, name: string) => void;
  onUpdate: (id: string) => void | Promise<void>;
  onCancelEdit: () => void;
  onTogglePin: (id: string) => void | Promise<void>;
  onDelete: (id: string, name: string) => void | Promise<void>;
  onApply: (search: SavedSearch) => void | Promise<void>;
}

function SearchItem({
  search,
  index,
  totalItems: _totalItems,
  editingId,
  searchName,
  getPreferencesSummary,
  onEdit,
  onUpdate,
  onCancelEdit,
  onTogglePin,
  onDelete,
  onApply,
}: SearchItemProps): JSX.Element {
  const itemAnimation = useStaggeredItem({ index });
  const itemBounce = useBounceOnTap({ scale: 0.98, duration: 150 });
  const itemHover = useHoverLift({ scale: 1.01 });
  const applyBounce = useBounceOnTap({ scale: 0.95, duration: 150 });
  const pinBounce = useBounceOnTap({ scale: 0.9, duration: 120 });
  const editBounce = useBounceOnTap({ scale: 0.9, duration: 120 });
  const deleteBounce = useBounceOnTap({ scale: 0.9, duration: 120 });

  const isEditing = editingId === search.id;

  return (
    <AnimatedView
      style={itemAnimation.animatedStyle}
      className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all"
      onMouseEnter={itemHover.handleEnter}
      onMouseLeave={itemHover.handleLeave}
    >
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={searchName}
            onChange={(e) => onEdit(search.id, e.target.value)}
            placeholder="Search name"
            autoFocus
          />
          <div className="flex gap-2">
            <MotionView style={itemBounce.animatedStyle}>
              <Button
                size="sm"
                onClick={() => {
                  itemBounce.handlePress();
                  void onUpdate(search.id);
                }}
                className="flex-1"
              >
                <Check size={16} className="mr-2" />
                Save
              </Button>
            </MotionView>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{search.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{search.name}</h4>
                  {search.isPinned && <Star size={14} className="text-yellow-500" weight="fill" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPreferencesSummary(search.preferences)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MotionView style={pinBounce.animatedStyle}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    pinBounce.handlePress();
                    void onTogglePin(search.id);
                  }}
                  className="h-8 w-8"
                >
                  <Star
                    size={16}
                    weight={search.isPinned ? 'fill' : 'regular'}
                    className={search.isPinned ? 'text-yellow-500' : ''}
                  />
                </Button>
              </MotionView>
              <MotionView style={editBounce.animatedStyle}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    editBounce.handlePress();
                    onEdit(search.id, search.name);
                  }}
                  className="h-8 w-8"
                >
                  <Pencil size={16} />
                </Button>
              </MotionView>
              <MotionView style={deleteBounce.animatedStyle}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    deleteBounce.handlePress();
                    void onDelete(search.id, search.name);
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash size={16} />
                </Button>
              </MotionView>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {search.useCount > 0 &&
                `Used ${search.useCount} time${search.useCount !== 1 ? 's' : ''}`}
              {search.lastUsed && ` • Last: ${new Date(search.lastUsed).toLocaleDateString()}`}
            </div>
            <MotionView style={applyBounce.animatedStyle}>
              <Button
                size="sm"
                onClick={() => {
                  applyBounce.handlePress();
                  void onApply(search);
                }}
              >
                Apply
              </Button>
            </MotionView>
          </div>
        </>
      )}
    </AnimatedView>
  );
}

export default function SavedSearchesManager({
  currentPreferences,
  onApplySearch,
  onClose,
}: SavedSearchesManagerProps): JSX.Element {
  const [savedSearches, setSavedSearches] = useStorage<SavedSearch[]>('saved-searches', []);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');

  const modalAnimation = useModalAnimation({ isVisible: true, duration: 300 });
  const saveFormExpand = useExpandCollapse({ isExpanded: showSaveForm, duration: 300 });
  const saveButtonBounce = useBounceOnTap({ scale: 0.95, duration: 150 });
  const cardHover = useHoverLift({ scale: 1.02 });

  const handleSaveCurrentSearch = useCallback(async (): Promise<void> => {
    try {
      if (!searchName.trim()) {
        toast.error('Please enter a name for this search');
        return;
      }

      const newSearch: SavedSearch = {
        id: `search-${Date.now()}`,
        name: searchName.trim(),
        icon: '🔍',
        preferences: currentPreferences,
        isPinned: false,
        useCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setSavedSearches((current) => [...(current ?? []), newSearch]);
      triggerHaptic('success');
      toast.success('Search saved!', { description: `"${searchName}" has been saved` });
      logger.info('Search saved', { searchId: newSearch.id, searchName: newSearch.name });
      setSearchName('');
      setShowSaveForm(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save search', err, { searchName });
      toast.error('Failed to save search');
      triggerHaptic('error');
    }
  }, [searchName, currentPreferences, setSavedSearches]);

  const handleUpdateSearch = useCallback(
    async (id: string): Promise<void> => {
      try {
        if (!searchName.trim()) {
          toast.error('Please enter a name');
          return;
        }

        await setSavedSearches((current) =>
          (current ?? []).map((s) =>
            s.id === id
              ? {
                ...s,
                name: searchName.trim(),
                preferences: currentPreferences,
                updatedAt: new Date().toISOString(),
              }
              : s
          )
        );
        triggerHaptic('light');
        toast.success('Search updated');
        logger.info('Search updated', { searchId: id, searchName: searchName.trim() });
        setEditingId(null);
        setSearchName('');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to update search', err, { searchId: id, searchName });
        toast.error('Failed to update search');
        triggerHaptic('error');
      }
    },
    [searchName, currentPreferences, setSavedSearches]
  );

  const handleApplySearch = useCallback(
    async (search: SavedSearch): Promise<void> => {
      try {
        await setSavedSearches((current) =>
          (current ?? []).map((s) =>
            s.id === search.id
              ? { ...s, useCount: s.useCount + 1, lastUsed: new Date().toISOString() }
              : s
          )
        );
        onApplySearch(search.preferences);
        triggerHaptic('selection');
        toast.success('Search applied', { description: `Filters updated to "${search.name}"` });
        logger.info('Search applied', { searchId: search.id, searchName: search.name });
        onClose();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to apply search', err, {
          searchId: search.id,
          searchName: search.name,
        });
        toast.error('Failed to apply search');
        triggerHaptic('error');
      }
    },
    [setSavedSearches, onApplySearch, onClose]
  );

  const handleTogglePin = useCallback(
    async (id: string): Promise<void> => {
      try {
        await setSavedSearches((current) =>
          (current ?? []).map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
        );
        triggerHaptic('light');
        logger.info('Search pin toggled', { searchId: id });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to toggle pin', err, { searchId: id });
        triggerHaptic('error');
      }
    },
    [setSavedSearches]
  );

  const handleDeleteSearch = useCallback(
    async (id: string, name: string): Promise<void> => {
      try {
        await setSavedSearches((current) => (current ?? []).filter((s) => s.id !== id));
        triggerHaptic('light');
        toast.info('Search deleted', { description: `"${name}" has been removed` });
        logger.info('Search deleted', { searchId: id, searchName: name });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to delete search', err, { searchId: id, searchName: name });
        toast.error('Failed to delete search');
        triggerHaptic('error');
      }
    },
    [setSavedSearches]
  );

  const sortedSearches = useMemo(() => {
    return [...(savedSearches ?? [])].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.useCount - a.useCount;
    });
  }, [savedSearches]);

  const getPreferencesSummary = useCallback((prefs: DiscoveryPreferences): string => {
    const parts: string[] = [];
    if (prefs.minAge !== 0 || prefs.maxAge !== 15) {
      parts.push(`${prefs.minAge}-${prefs.maxAge}y`);
    }
    if (prefs.sizes.length < 4) {
      parts.push(`${prefs.sizes.length} sizes`);
    }
    if (prefs.maxDistance !== 50) {
      parts.push(`${prefs.maxDistance}km`);
    }
    if (prefs.personalities.length > 0) {
      parts.push(`${prefs.personalities.length} traits`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'All filters';
  }, []);

  return (
    <MotionView
      style={modalAnimation.style}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <BookmarkSimple size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saved Searches</h1>
              <p className="text-sm text-muted-foreground">Quick access to your favorite filters</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="X">
            <X size={24} />
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Filters</CardTitle>
                <CardDescription>Save your current search criteria</CardDescription>
              </div>
              <MotionView
                style={cardHover.animatedStyle}
                onMouseEnter={cardHover.handleEnter}
                onMouseLeave={cardHover.handleLeave}
              >
                <Button onClick={() => setShowSaveForm(!showSaveForm)} size="sm">
                  <Plus size={16} className="mr-2" />
                  Save Current
                </Button>
              </MotionView>
            </div>
          </CardHeader>
          <CardContent>
            {showSaveForm && (
              <AnimatedView style={saveFormExpand.heightStyle} className="mb-4 overflow-hidden">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="search-name" className="sr-only">
                      Search Name
                    </Label>
                    <Input
                      id="search-name"
                      placeholder="e.g., Active dogs under 5"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveButtonBounce.handlePress();
                          void handleSaveCurrentSearch();
                        }
                      }}
                    />
                  </div>
                  <MotionView style={saveButtonBounce.animatedStyle}>
                    <Button onClick={() => void handleSaveCurrentSearch()}>
                      <FloppyDisk size={16} className="mr-2" />
                      Save
                    </Button>
                  </MotionView>
                </div>
              </AnimatedView>
            )}

            <div className="text-sm text-muted-foreground">
              {getPreferencesSummary(currentPreferences)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Saved Searches</CardTitle>
            <CardDescription>
              {sortedSearches.length === 0
                ? 'No saved searches yet'
                : `${String(sortedSearches.length)} saved search${sortedSearches.length !== 1 ? 'es' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-125">
              {sortedSearches.length === 0 ? (
                <div className="text-center py-12">
                  <BookmarkSimple size={48} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No saved searches yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save your current filters to quickly access them later
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSearches.map((search, index) => (
                    <SearchItem
                      key={search.id}
                      search={search}
                      index={index}
                      totalItems={sortedSearches.length}
                      editingId={editingId}
                      searchName={searchName}
                      getPreferencesSummary={getPreferencesSummary}
                      onEdit={(id, name) => {
                        setEditingId(id);
                        setSearchName(name);
                      }}
                      onUpdate={handleUpdateSearch}
                      onCancelEdit={() => {
                        setEditingId(null);
                        setSearchName('');
                      }}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDeleteSearch}
                      onApply={handleApplySearch}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MotionView>
  );
}
