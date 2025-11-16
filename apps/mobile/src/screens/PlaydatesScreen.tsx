/**
 * PlaydatesScreen Component
 *
 * Mobile screen for viewing and managing playdates
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { PlaydateCard } from '@mobile/components/playdates/PlaydateCard.native';
import type { Playdate } from '@petspark/core';
import { colors } from '@mobile/theme/colors';
import { playdatesClient } from '@petspark/core';

export function PlaydatesScreen(): React.JSX.Element {
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(false);

  const handlePlaydatePress = useCallback((playdate: Playdate) => {
    // Navigate to playdate details
  }, []);

  const handleJoin = useCallback((playdate: Playdate) => {
    // Join playdate logic
  }, []);

  const handleCheckIn = useCallback((playdate: Playdate) => {
    // Check in logic
  }, []);

  const renderPlaydate = useCallback(
    ({ item, index }: { item: Playdate; index: number }) => (
      <PlaydateCard
        playdate={item}
        index={index}
        onPress={() => handlePlaydatePress(item)}
        onJoin={() => handleJoin(item)}
        onCheckIn={() => handleCheckIn(item)}
        isParticipant={item.participants?.some((p) => p.userId === 'current-user')}
      />
    ),
    [handlePlaydatePress, handleJoin, handleCheckIn]
  );

  if (viewMode === 'map') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Playdates Map</Text>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={styles.toggleButton}>List</Text>
          </TouchableOpacity>
        </View>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {playdates.map((playdate) => {
            if (!playdate.location?.coordinates) return null;
            return (
              <Marker
                key={playdate.id}
                coordinate={{
                  latitude: playdate.location.coordinates.latitude,
                  longitude: playdate.location.coordinates.longitude,
                }}
                title={playdate.title}
              />
            );
          })}
        </MapView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Playdates</Text>
        <TouchableOpacity onPress={() => setViewMode('map')}>
          <Text style={styles.toggleButton}>Map</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playdates}
        renderItem={renderPlaydate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No playdates yet</Text>
            <Text style={styles.emptySubtext}>Create your first playdate!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  toggleButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

