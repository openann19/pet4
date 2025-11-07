/**
 * Adoption Management Screen (Mobile)
 * 
 * Mobile admin screen for managing adoption listings and applications.
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import logger from '@/core/logger';

interface AdoptionListing {
  id: string;
  petName: string;
  status: 'available' | 'pending' | 'adopted' | 'flagged';
  createdAt: string;
  applicationsCount: number;
}

export const AdoptionManagementScreen: React.FC = () => {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'pending' | 'adopted' | 'flagged'>('all');

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await adminApi.getAdoptionListings(filter);
      // setListings(data);
      setListings([]);
    } catch (error) {
      logger.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'adopted':
        return '#6366f1';
      case 'flagged':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Adoption Management</Text>
          <Text style={styles.headerSubtitle}>Manage adoption listings</Text>
        </View>
      </FadeInView>

      <View style={styles.filterContainer}>
        {(['all', 'available', 'pending', 'adopted', 'flagged'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => { setFilter(f); }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        ) : (
          filteredListings.map((listing, index) => (
            <FadeInView key={listing.id} delay={index * 50}>
              <AnimatedCard style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <View>
                    <Text style={styles.petName}>{listing.petName}</Text>
                    <Text style={styles.listingDate}>
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(listing.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(listing.status) },
                      ]}
                    >
                      {listing.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.applicationsText}>
                  {listing.applicationsCount} application(s)
                </Text>
              </AnimatedCard>
            </FadeInView>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#6366f1',
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  listingCard: {
    marginBottom: 12,
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listingDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  applicationsText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

