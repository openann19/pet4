import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { PlaydateCard, type Playdate } from './PlaydateCard';

interface PlaydatesListProps {
  playdates: Playdate[];
  onPlaydatePress: (playdate: Playdate) => void;
  onRSVP: (playdateId: string, response: 'yes' | 'no' | 'maybe') => void;
}

type FilterType = 'all' | 'upcoming' | 'past';

export const PlaydatesList: React.FC<PlaydatesListProps> = ({
  playdates,
  onPlaydatePress,
  onRSVP,
}) => {
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const filterPlaydates = (): Playdate[] => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return playdates.filter((p) => new Date(p.date) >= now);
      case 'past':
        return playdates.filter((p) => new Date(p.date) < now);
      default:
        return playdates;
    }
  };

  const filteredPlaydates = filterPlaydates();

  const renderFilterButton = (type: FilterType, label: string, count: number) => (
    <Pressable
      key={type}
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{label}</Text>
      <View style={[styles.filterBadge, filter === type && styles.filterBadgeActive]}>
        <Text style={[styles.filterBadgeText, filter === type && styles.filterBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );

  const upcomingCount = playdates.filter((p) => new Date(p.date) >= new Date()).length;
  const pastCount = playdates.filter((p) => new Date(p.date) < new Date()).length;

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterButton('upcoming', 'Upcoming', upcomingCount)}
        {renderFilterButton('past', 'Past', pastCount)}
        {renderFilterButton('all', 'All', playdates.length)}
      </View>

      {/* List */}
      {filteredPlaydates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No playdates</Text>
          <Text style={styles.emptyText}>
            {filter === 'upcoming' ? 'Schedule a playdate to get started!' : 'No playdates to show'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaydates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaydateCard
              playdate={item}
              onPress={() => onPlaydatePress(item)}
              onRSVP={(response) => onRSVP(item.id, response)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
