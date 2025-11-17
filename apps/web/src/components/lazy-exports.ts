/**
 * Lazy-loaded exports for heavy components
 * These components are code-split to reduce initial bundle size
 */

import { lazy } from 'react';

/**
 * MediaViewer - Heavy component with media viewing capabilities
 * Lazy loaded to reduce initial bundle size
 */
export const MediaViewer = lazy(() =>
  import('./community/MediaViewer').then((module) => ({
    default: module.MediaViewer,
  }))
);

// Export type for MediaViewer
export type { MediaItem } from './community/MediaViewer';

/**
 * StoryViewer - Heavy component with story viewing capabilities
 * Lazy loaded to reduce initial bundle size
 */
export const StoryViewer = lazy(() =>
  import('./stories/StoryViewer')
);

/**
 * MediaEditor - Heavy component with media editing capabilities
 * Lazy loaded to reduce initial bundle size
 */
export const MediaEditor = lazy(() =>
  import('./media-editor/MediaEditor').then((module) => ({
    default: module.MediaEditor,
  }))
);

// Export type for MediaEditor
export type { MediaEditorProps } from './media-editor/MediaEditor';

/**
 * PlaydateScheduler - Heavy component with scheduling capabilities
 * Lazy loaded to reduce initial bundle size
 */
export const PlaydateScheduler = lazy(() =>
  import('./playdate/PlaydateScheduler')
);

/**
 * PetHealthDashboard - Heavy component with health tracking
 * Lazy loaded to reduce initial bundle size
 */
export const PetHealthDashboard = lazy(() =>
  import('./health/PetHealthDashboard')
);
