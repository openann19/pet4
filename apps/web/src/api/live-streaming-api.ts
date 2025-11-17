/**
 * Live Streaming API - Main Entry Point
 * Re-exports types, core API class, and singleton instance
 */

import { LiveStreamingAPI } from './live-streaming-api-core';
export { LiveStreamingAPI } from './live-streaming-api-core';
export type * from './live-streaming-api-types';

export const liveStreamingAPI = new LiveStreamingAPI();
