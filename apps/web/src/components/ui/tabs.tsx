'use client';

import type { ComponentProps } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig, getTypographyClasses } from '@/lib/typography';

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      role="tablist"
      className={cn('flex flex-col', getSpacingClassesFromConfig({ gap: 'sm' }), className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        'inline-flex h-9 w-fit items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground shadow-sm',
        getSpacingClassesFromConfig({ padding: 'xs' }),
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      role="tab"
      className={cn(
        'inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center rounded-lg border border-transparent text-foreground transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        getTypographyClasses('bodyMuted'),
        getSpacingClassesFromConfig({ gap: 'xs', paddingX: 'sm', paddingY: 'xs' }),
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      role="tabpanel"
      className={cn('flex-1 outline-none border border-transparent data-[state=inactive]:pointer-events-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
