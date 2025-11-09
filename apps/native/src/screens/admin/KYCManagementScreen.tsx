/**
 * KYC Management Screen (Mobile)
 *
 * Mobile admin screen for reviewing KYC verification submissions.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createLogger } from '../../utils/logger';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';

const logger = createLogger('KYCManagementScreen');

interface KYCSession {
  id: string;
  userId: string;
  userName: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  documents: Array<{ type: string; url: string }>;
}

export const KYCManagementScreen: React.FC = () => {
  const [sessions, setSessions] = useState<KYCSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mobileAdminApi.getKYCQueue();
      const sessionsData: KYCSession[] = data.map((item) => ({
        id: item.id,
        userId: item.userId,
        userName: `User ${item.userId.substring(0, 8)}`,
        status: item.status as 'pending' | 'verified' | 'rejected',
        createdAt: item.createdAt,
        documents: [],
      }));
      setSessions(sessionsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load KYC sessions', err, { context: 'loadSessions', filter });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleVerify = useCallback(
    async (sessionId: string) => {
      try {
        await mobileAdminApi.reviewKYC(sessionId, 'approve');
        await loadSessions();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to verify session', err, { context: 'handleVerify', sessionId });
      }
    },
    [loadSessions]
  );

  const handleReject = useCallback(
    async (sessionId: string) => {
      try {
        await mobileAdminApi.reviewKYC(sessionId, 'reject', 'Rejected by admin');
        await loadSessions();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to reject session', err, { context: 'handleReject', sessionId });
      }
    },
    [loadSessions]
  );

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'verified':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <Text style={styles.headerSubtitle}>Review identity documents</Text>
        </View>
      </FadeInView>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
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
        ) : filteredSessions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No KYC sessions found</Text>
          </View>
        ) : (
          filteredSessions.map((session, index) => (
            <FadeInView key={session.id} delay={index * 50}>
              <AnimatedCard style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View>
                    <Text style={styles.sessionUserName}>{session.userName}</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(session.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                      {session.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.documentsLabel}>{session.documents.length} document(s)</Text>

                {session.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => {
                        void handleVerify(session.id);
                      }}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => {
                        void handleReject(session.id);
                      }}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
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
  sessionCard: {
    marginBottom: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDate: {
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
  documentsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
