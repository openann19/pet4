/**
 * Audit Log Screen (Mobile)
 *
 * Mobile admin screen for viewing audit logs of admin actions.
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
import { createLogger } from '../../utils/logger';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';

const logger = createLogger('AuditLogScreen');

interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: string;
}

export const AuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'user' | 'content' | 'config'>('all');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await mobileAdminApi.getAuditLogs(100);
      const filteredData =
        filter === 'all' ? data : data.filter((log) => log.targetType === filter);
      const logsData: AuditLogEntry[] = filteredData.map((item) => ({
        id: item.id,
        adminId: item.adminId,
        adminName: `Admin ${item.adminId.substring(0, 8)}`,
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        details: item.details,
        timestamp: item.timestamp,
      }));
      setLogs(logsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load audit logs', err, { context: 'loadLogs', filter });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.targetType === filter;
  });

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban') || action.includes('reject')) {
      return '#ef4444';
    }
    if (action.includes('create') || action.includes('approve') || action.includes('verify')) {
      return '#22c55e';
    }
    if (action.includes('update') || action.includes('modify')) {
      return '#3b82f6';
    }
    return '#6b7280';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Audit Log</Text>
          <Text style={styles.headerSubtitle}>View all admin actions</Text>
        </View>
      </FadeInView>

      <View style={styles.filterContainer}>
        {(['all', 'user', 'content', 'config'] as const).map((f) => (
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
        ) : filteredLogs.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No audit logs found</Text>
          </View>
        ) : (
          filteredLogs.map((log, index) => (
            <FadeInView key={log.id} delay={index * 50}>
              <AnimatedCard style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={styles.adminName}>{log.adminName}</Text>
                    <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                  </View>
                  <View
                    style={[
                      styles.actionBadge,
                      { backgroundColor: getActionColor(log.action) + '20' },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: getActionColor(log.action) }]}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.logDetails}>
                  <Text style={styles.detailLabel}>Target:</Text>
                  <Text style={styles.detailValue}>
                    {log.targetType} ({log.targetId})
                  </Text>
                </View>

                {log.details && (
                  <View style={styles.logDetails}>
                    <Text style={styles.detailLabel}>Details:</Text>
                    <Text style={styles.detailValue}>{log.details}</Text>
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
  logCard: {
    marginBottom: 12,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  logDetails: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
  },
});
