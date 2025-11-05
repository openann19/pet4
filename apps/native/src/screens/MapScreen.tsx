import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface MapMarker {
  id: string;
  name: string;
  type: 'pet' | 'place' | 'lost-pet';
  latitude: number;
  longitude: number;
  distance?: number;
  photo?: string;
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pets' | 'places' | 'lost'>('all');
  const [preciseSharingEnabled, setPreciseSharingEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use the map feature.'
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // Load sample markers near user location
      loadNearbyMarkers(loc.coords.latitude, loc.coords.longitude);
      setLoading(false);
    })();
  }, []);

  const loadNearbyMarkers = (lat: number, lon: number) => {
    // Sample data - in production this would come from an API
    const sampleMarkers: MapMarker[] = [
      {
        id: '1',
        name: 'Buddy',
        type: 'pet',
        latitude: lat + 0.01,
        longitude: lon + 0.01,
        distance: 1.2,
        photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
      },
      {
        id: '2',
        name: 'Central Park',
        type: 'place',
        latitude: lat - 0.01,
        longitude: lon + 0.02,
        distance: 2.5,
      },
      {
        id: '3',
        name: 'Lost Golden Retriever',
        type: 'lost-pet',
        latitude: lat + 0.02,
        longitude: lon - 0.01,
        distance: 3.1,
      },
    ];
    setMarkers(sampleMarkers);
  };

  const filteredMarkers = markers.filter((marker) => {
    if (selectedCategory !== 'all' && marker.type !== selectedCategory.replace('s', '')) {
      return false;
    }
    if (searchQuery && !marker.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const togglePreciseSharing = () => {
    setPreciseSharingEnabled(!preciseSharingEnabled);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Map</Text>
        </View>
        <View style={styles.content}>
          <LoadingSkeleton height={200} />
          <LoadingSkeleton height={80} style={{ marginTop: 16 }} />
          <LoadingSkeleton height={80} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Map</Text>
        <Text style={styles.subtitle}>Discover pets and places nearby</Text>
      </View>

      <FadeInView delay={100}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {(['all', 'pets', 'places', 'lost'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === 'all'
                  ? '🌍 All'
                  : category === 'pets'
                  ? '🐾 Pets'
                  : category === 'places'
                  ? '📍 Places'
                  : '🔍 Lost'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeInView>

      <FadeInView delay={300}>
        <AnimatedCard style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Your Location</Text>
            {location ? (
              <Text style={styles.locationText}>
                📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.locationText}>Location unavailable</Text>
            )}
          </View>
          <AnimatedButton
            onPress={togglePreciseSharing}
            style={[
              styles.preciseButton,
              preciseSharingEnabled && styles.preciseButtonActive,
            ]}
          >
            <Text
              style={[
                styles.preciseButtonText,
                preciseSharingEnabled && styles.preciseButtonTextActive,
              ]}
            >
              {preciseSharingEnabled ? '✓ Precise' : '⊙ Coarse'}
            </Text>
          </AnimatedButton>
        </AnimatedCard>
      </FadeInView>

      <ScrollView style={styles.markersList} showsVerticalScrollIndicator={false}>
        {filteredMarkers.map((marker, index) => (
          <FadeInView key={marker.id} delay={400 + index * 50}>
            <AnimatedCard style={styles.markerCard}>
              <View style={styles.markerIcon}>
                <Text style={styles.markerEmoji}>
                  {marker.type === 'pet' ? '🐕' : marker.type === 'place' ? '📍' : '🔍'}
                </Text>
              </View>
              <View style={styles.markerInfo}>
                <Text style={styles.markerName}>{marker.name}</Text>
                <Text style={styles.markerDistance}>
                  {marker.distance ? `${marker.distance.toFixed(1)} km away` : 'Unknown distance'}
                </Text>
              </View>
              <AnimatedButton style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View</Text>
              </AnimatedButton>
            </AnimatedCard>
          </FadeInView>
        ))}

        {filteredMarkers.length === 0 && (
          <FadeInView delay={400}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search query
              </Text>
            </View>
          </FadeInView>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📍 {filteredMarkers.length} {filteredMarkers.length === 1 ? 'result' : 'results'} nearby
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categories: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  locationCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  preciseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  preciseButtonActive: {
    backgroundColor: '#6366f1',
  },
  preciseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  preciseButtonTextActive: {
    color: '#fff',
  },
  markersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  markerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  markerEmoji: {
    fontSize: 24,
  },
  markerInfo: {
    flex: 1,
  },
  markerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  markerDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
