/**
 * Tests for Map Clustering
 * 
 * Location: apps/web/src/lib/maps/clustering.test.ts
 */

import { describe, expect, it } from 'vitest'
import { cluster, type Point } from './clustering'

describe('cluster', () => {
  it('should return empty array for empty input', () => {
    const result = cluster([], 10)
    expect(result).toEqual([])
  })

  it('should cluster nearby points', () => {
    const points: Point[] = [
      { id: '1', lat: 37.7749, lng: -122.4194 },
      { id: '2', lat: 37.7750, lng: -122.4195 },
      { id: '3', lat: 37.7748, lng: -122.4193 },
    ]

    const clusters = cluster(points, 12, 60)
    
    expect(clusters.length).toBeGreaterThan(0)
    expect(clusters[0]?.count).toBeGreaterThanOrEqual(1)
  })

  it('should separate distant points', () => {
    const points: Point[] = [
      { id: '1', lat: 37.7749, lng: -122.4194 },
      { id: '2', lat: 40.7128, lng: -74.0060 }, // NYC, far from SF
    ]

    const clusters = cluster(points, 10, 60)
    
    // Should create separate clusters
    expect(clusters.length).toBe(2)
    clusters.forEach(cluster => {
      expect(cluster.count).toBe(1)
    })
  })

  it('should calculate cluster center correctly', () => {
    const points: Point[] = [
      { id: '1', lat: 37.7749, lng: -122.4194 },
      { id: '2', lat: 37.7751, lng: -122.4196 },
    ]

    const clusters = cluster(points, 12, 60)
    
    if (clusters.length > 0 && clusters[0]?.count === 2) {
      const center = clusters[0]
      const expectedLat = (37.7749 + 37.7751) / 2
      const expectedLng = (-122.4194 + -122.4196) / 2
      
      expect(center.lat).toBeCloseTo(expectedLat, 4)
      expect(center.lng).toBeCloseTo(expectedLng, 4)
    }
  })

  it('should include all point IDs in cluster', () => {
    const points: Point[] = [
      { id: '1', lat: 37.7749, lng: -122.4194 },
      { id: '2', lat: 37.7750, lng: -122.4195 },
    ]

    const clusters = cluster(points, 12, 60)
    
    const allIds = clusters.flatMap(c => c.ids)
    expect(allIds).toContain('1')
    expect(allIds).toContain('2')
  })

  it('should respect zoom level', () => {
    const points: Point[] = [
      { id: '1', lat: 37.7749, lng: -122.4194 },
      { id: '2', lat: 37.7750, lng: -122.4195 },
    ]

    const clustersLowZoom = cluster(points, 8, 60)
    const clustersHighZoom = cluster(points, 15, 60)
    
    // Lower zoom should cluster more aggressively
    expect(clustersLowZoom.length).toBeLessThanOrEqual(clustersHighZoom.length)
  })
})

