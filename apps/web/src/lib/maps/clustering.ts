/**
 * Map Clustering Utility
 *
 * Provides grid-based clustering for map markers without heavy dependencies.
 * Efficiently groups nearby points into clusters for better performance.
 *
 * Location: apps/web/src/components/views/MapView.tsx (utility functions)
 */

export interface Point {
  id: string;
  lat: number;
  lng: number;
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  ids: string[];
}

/**
 * Cluster points using grid-based algorithm
 *
 * Groups points into spatial buckets based on zoom level.
 * Points in the same grid cell are combined into a single cluster.
 *
 * @param points - Array of points to cluster
 * @param zoom - Current map zoom level
 * @param cellSize - Grid cell size in pixels (default: 60)
 * @returns Array of clusters
 *
 * @example
 * ```typescript
 * const clusters = cluster(points, 12, 60)
 * clusters.forEach(cluster => {
 *   if (cluster.count === 1) {
 *     // Single point, show marker
 *   } else {
 *     // Multiple points, show cluster marker with count
 *   }
 * })
 * ```
 */
export function cluster(points: Point[], zoom: number, cellSize = 60): Cluster[] {
  if (points.length === 0) return [];

  // Calculate scale factor based on zoom level
  const scale = Math.pow(2, zoom);

  // Bucket points by grid cell
  const buckets = new Map<string, Point[]>();

  for (const point of points) {
    // Calculate grid cell key
    const key = `${Math.round((point.lat * scale) / cellSize)},${Math.round((point.lng * scale) / cellSize)}`;

    // Add point to bucket
    const bucket = buckets.get(key) || [];
    bucket.push(point);
    buckets.set(key, bucket);
  }

  // Convert buckets to clusters
  return Array.from(buckets.values()).map((group) => {
    const avgLat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
    const avgLng = group.reduce((sum, p) => sum + p.lng, 0) / group.length;

    return {
      lat: avgLat,
      lng: avgLng,
      count: group.length,
      ids: group.map((p) => p.id),
    };
  });
}
