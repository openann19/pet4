/**
 * Community API Client - Main Entry Point
 * Re-exports types, core API class, and singleton instance
 */

import { CommunityApiImpl } from './community-api-client-core';
export { CommunityApiImpl } from './community-api-client-core';
export type * from './community-api-client-types';

export const communityApi = new CommunityApiImpl();
