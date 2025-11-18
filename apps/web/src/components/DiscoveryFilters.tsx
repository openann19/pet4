'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Funnel } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';

import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  DEFAULT_PREFERENCES,
  hasActiveDiscoveryFilters,
  type DiscoveryPreferences,
} from '@/components/discovery-preferences';
import { DiscoveryFiltersBasicTab } from '@/components/DiscoveryFiltersBasicTab';
import { DiscoveryFiltersMediaTab } from '@/components/DiscoveryFiltersMediaTab';
import { DiscoveryFiltersAdvancedTab } from '@/components/DiscoveryFiltersAdvancedTab';
import { getTypographyClasses } from '@/lib/typography';

export default function DiscoveryFilters() {
  const [storedPrefs, setStoredPrefs] = useStorage<DiscoveryPreferences>(
    'discovery-preferences',
    DEFAULT_PREFERENCES,
  );
  const [open, setOpen] = useState(false);

  // Local draft so you can tweak sliders, then "Apply"
  const [draft, setDraft] = useState<DiscoveryPreferences>(
    storedPrefs ?? DEFAULT_PREFERENCES,
  );

  // When the sheet opens, sync draft from storage
  useEffect(() => {
    if (open) {
      setDraft(storedPrefs ?? DEFAULT_PREFERENCES);
    }
  }, [open, storedPrefs]);

  const hasActiveFilters = useMemo(
    () => hasActiveDiscoveryFilters(draft),
    [draft],
  );

  const handleDraftChange = useCallback((next: DiscoveryPreferences) => {
    setDraft(next);
  }, []);

  const handleSave = useCallback(() => {
    void setStoredPrefs(draft);
    setOpen(false);
  }, [draft, setStoredPrefs]);

  const handleReset = useCallback(() => {
    setDraft(DEFAULT_PREFERENCES);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger with MotionView hover/tap + pulsing badge */}
      <SheetTrigger asChild>
        <MotionView
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Button variant="outline" size="sm" className="relative gap-2" type="button">
            <Funnel size={16} weight={hasActiveFilters ? 'fill' : 'regular'} />
            Filters
            {hasActiveFilters && (
              <MotionView
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
              />
            )}
          </Button>
        </MotionView>
      </SheetTrigger>

      <SheetContent className="flex h-full flex-col overflow-hidden sm:max-w-md">
        <SheetHeader className="shrink-0">
          <SheetTitle className={`flex items-center gap-2 ${getTypographyClasses('h2')}`}>
            <MotionView
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span>🎯</span>
            </MotionView>
            Discovery Preferences
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full shrink-0 grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4 flex-1 overflow-hidden">
            <DiscoveryFiltersBasicTab draft={draft} onDraftChange={handleDraftChange} />
          </TabsContent>

          <TabsContent value="media" className="mt-4 flex-1 overflow-hidden">
            <DiscoveryFiltersMediaTab draft={draft} onDraftChange={handleDraftChange} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4 flex-1 overflow-hidden">
            <DiscoveryFiltersAdvancedTab draft={draft} onDraftChange={handleDraftChange} />
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex shrink-0 gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => void handleReset()}
          >
            Reset All
          </Button>
          <Button type="button" className="flex-1" onClick={() => void handleSave()}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
