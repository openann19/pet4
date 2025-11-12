import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import type { PetProfile } from '@mobile/types/pet'
import type { PetApiResponse } from '@mobile/types/api'
import { matchingApi } from '@mobile/utils/api-client'
import { createLogger } from '@mobile/utils/logger'
import * as Haptics from 'expo-haptics'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('FeedScreen')

type Tab = 'discovery' | 'map'

/**
 * Valid species types
 */
type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'

/**
 * Map API response pet to UI PetProfile
 */
function mapApiPetToProfile(apiPet: PetApiResponse): PetProfile {
  // Validate species - default to 'other' if invalid
  const validSpecies: PetSpecies[] = ['dog', 'cat', 'bird', 'rabbit', 'other']
  const species = validSpecies.includes(apiPet.species as PetSpecies)
    ? (apiPet.species as PetSpecies)
    : 'other'

  // Filter and map media to photos
  const photos = apiPet.media.filter(media => media.type === 'photo').map(media => media.url)

  return {
    id: apiPet.id,
    ownerId: apiPet.ownerId,
    name: apiPet.name,
    species,
    breed: apiPet.breedName,
    age: Math.floor(apiPet.ageMonths / 12),
    photos,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

interface SegmentBtnProps {
  label: string
  selected: boolean
  onPress: () => void
}

function SegmentBtn({ label, selected, onPress }: SegmentBtnProps): React.ReactElement {
  return (
    <Text
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={[styles.segmentLabel, selected && styles.segmentLabelActive]}
      numberOfLines={1}
    >
      {label}
    </Text>
  )
}

function DiscoveryList(): React.ReactElement {
  const [pets, setPets] = useState<PetProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await matchingApi.getAvailablePets({ limit: 20 })

      // Map API response to PetProfile format using type-safe mapper
      const mappedPets: PetProfile[] = response.pets.map(mapApiPetToProfile)

      setPets(mappedPets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pets'
      logger.error('Failed to load pets', err instanceof Error ? err : new Error(String(err)))
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPets()
  }, [loadPets])

  if (isTruthy(loading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (isTruthy(error)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          onPress={() => {
            void loadPets()
          }}
          style={styles.retryText}
        >
          Retry
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      data={pets}
      keyExtractor={p => String(p.id)}
      renderItem={({ item }) => (
        <FeatureCard title={item.name} subtitle={`${String(item.breed ?? '')} • ${String(item.age ?? '')} years old`}>
          <View style={styles.row}>
            <Text style={styles.label}>Species</Text>
            <Text style={styles.value}>{item.species}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Photos</Text>
            <Text style={styles.value}>{item.photos.length}</Text>
          </View>
        </FeatureCard>
      )}
    />
  )
}

function MapPane(): React.ReactElement {
  // Initialize all hooks BEFORE any conditional returns (React rules)
  const initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  // Throttled region state using useSharedValue
  const regionSV = useSharedValue({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta,
    longitudeDelta: initialRegion.longitudeDelta,
  })

  // Throttled onRegionChange handler (120ms delay, trailing: true)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRegionRef = useRef<typeof initialRegion | null>(null)

  // Optional dynamic MapView (no hard dep). If the package is missing, we fall back gracefully.
  type MapViewProps = {
    style?: unknown
    initialRegion?: {
      latitude: number
      longitude: number
      latitudeDelta: number
      longitudeDelta: number
    }
    onRegionChange?: (region: {
      latitude: number
      longitude: number
      latitudeDelta: number
      longitudeDelta: number
    }) => void
    children?: React.ReactNode
  }
  const [MapView, setMapView] = useState<React.ComponentType<MapViewProps> | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadMapView() {
      try {
        // Dynamic import for optional dependency
        const mapsModule = await import('react-native-maps').catch(() => null)
        if (!mounted) return

        if (mapsModule) {
          const MapComponent = mapsModule.default
          if (MapComponent && typeof MapComponent === 'function') {
            setMapView(() => MapComponent as unknown as React.ComponentType<MapViewProps>)
          } else {
            setMapView(null)
          }
        } else {
          setMapView(null)
        }
      } catch {
        if (mounted) {
          setMapView(null)
        }
      }
    }

    loadMapView()

    return () => {
      mounted = false
    }
  }, [])

  const onRegionChange = useCallback(
    (region: typeof initialRegion) => {
      // Store pending region
      pendingRegionRef.current = region

      // Clear existing timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }

      // Set new timeout with trailing behavior
      throttleTimeoutRef.current = setTimeout(() => {
        if (pendingRegionRef.current) {
          regionSV.value = {
            latitude: pendingRegionRef.current.latitude,
            longitude: pendingRegionRef.current.longitude,
            latitudeDelta: pendingRegionRef.current.latitudeDelta,
            longitudeDelta: pendingRegionRef.current.longitudeDelta,
          }
          pendingRegionRef.current = null
        }
        throttleTimeoutRef.current = null
      }, 120)
    },
    [regionSV]
  )

  useEffect(() => {
    return () => {
      if (isTruthy(throttleTimeoutRef.current)) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [])

  if (!MapView) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mapFallbackTitle}>Map module not installed</Text>
        <Text style={styles.mapFallbackText}>
          Install <Text style={styles.code}>react-native-maps</Text> to enable the live map view.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.mapWrap}>
      {MapView && (
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onRegionChange={onRegionChange}
        >
          {/* You can drop markers from your real data once coords are available */}
        </MapView>
      )}
    </View>
  )
}

export function FeedScreen(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('discovery')
  const x = useSharedValue(0)

  const handleTabChange = useCallback(
    (next: Tab): void => {
      if (next === tab) return
      try {
        void Haptics.selectionAsync()
      } catch {
        // Haptics may not be available
      }
      setTab(next)
      x.value = withTiming(next === 'discovery' ? 0 : 1, { duration: 180 })
    },
    [tab, x]
  )

  const indicator = useAnimatedStyle(() => {
    const translateX = x.value * 100
    return {
      transform: [{ translateX }],
    }
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SectionHeader title="Discover" description="Browse nearby pets or switch to map view." />

        <View style={styles.segment} accessibilityRole="tablist">
          <View style={styles.segmentTrack}>
            <Animated.View style={[styles.segmentIndicator, indicator]} />
            <SegmentBtn
              label="Discover"
              selected={tab === 'discovery'}
              onPress={() => {
                handleTabChange('discovery')
              }}
            />
            <SegmentBtn
              label="Map"
              selected={tab === 'map'}
              onPress={() => {
                handleTabChange('map')
              }}
            />
          </View>
        </View>

        {tab === 'discovery' ? <DiscoveryList /> : <MapPane />}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  segment: { paddingHorizontal: 16, marginBottom: 8 },
  segmentTrack: {
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    height: 36,
    width: '50%',
    left: 2,
    top: 2,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  segmentLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    zIndex: 1,
  },
  segmentLabelActive: { color: colors.textPrimary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textPrimary, fontWeight: '600' },
  value: { color: colors.textSecondary, textTransform: 'capitalize' },
  mapWrap: {
    flex: 1,
    minHeight: 280,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapFallback: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mapFallbackTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
  },
  mapFallbackText: { color: colors.textSecondary },
  code: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: colors.danger || 'var(--color-error-9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
})
