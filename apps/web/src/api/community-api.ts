/**
 * Community API - Main Entry Point
 * Re-exports types, core API class, and singleton instance
 */

import { isTruthy } from '@petspark/shared';
import { CommunityAPI } from './community-api-core';
export { CommunityAPI } from './community-api-core';
export type * from './community-api-types';

// Singleton instance with HMR-friendly pattern
let communityAPIInstance: CommunityAPI | null = null;

export function getCommunityAPI(): CommunityAPI {
  communityAPIInstance ??= new CommunityAPI();
  return communityAPIInstance;
}

// Export instance for backward compatibility (HMR-safe)
export const communityAPI = getCommunityAPI();

// HMR support: reset instance on hot module replacement
if (isTruthy(import.meta.hot)) {
  import.meta.hot.accept(() => {
    communityAPIInstance = null;
  });
}
