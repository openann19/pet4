/**
 * Chat Moderation Screen (Mobile)
 *
 * Mobile admin screen for reviewing reported chat messages.
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
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';

const logger = createLogger('ChatModerationScreen');

interface MessageReport {
  id: string;
  messageId: string;
  reportedUserId: string;
  reportedUserName: string;
  messageContent: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export const ChatModerationScreen: React.FC = () => {
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'warning' | 'mute' | 'suspend' | 'no_action'>('no_action');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Note: Chat reports API endpoint not yet available in admin-api
      // When backend provides endpoint, update to: await mobileAdminApi.getChatReports();
      setReports([]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load reports', err, { context: 'loadReports' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string) => {
    try {
      // Note: Chat report review API endpoint not yet available in admin-api
      // When backend provides endpoint, update to: await mobileAdminApi.reviewChatReport(reportId, action);
      await loadReports();
      setAction('no_action');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to review report', err, { context: 'handleReview', reportId, action });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ef4444';
      case 'reviewed':
        return '#f59e0b';
      case 'resolved':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Moderation</Text>
          <Text style={styles.headerSubtitle}>Review reported messages</Text>
        </View>
      </FadeInView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
          </View>
        ) : (
          reports.map((report, index) => (
            <FadeInView key={report.id} delay={index * 50}>
              <AnimatedCard style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.reportedUser}>{report.reportedUserName}</Text>
                    <Text style={styles.reportDate}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(report.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.messageContainer}>
                  <Text style={styles.messageLabel}>Reported Message:</Text>
                  <Text style={styles.messageContent}>{report.messageContent}</Text>
                </View>

                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonText}>{report.reason}</Text>
                </View>

                {report.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.warningButton]}
                      onPress={() => {
                        setAction('warning');
                        handleReview(report.id);
                      }}
                    >
                      <Text style={styles.actionText}>Warn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.muteButton]}
                      onPress={() => {
                        setAction('mute');
                        handleReview(report.id);
                      }}
                    >
                      <Text style={styles.actionText}>Mute</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => {
                        setAction('suspend');
                        handleReview(report.id);
                      }}
                    >
                      <Text style={styles.actionText}>Suspend</Text>
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
  reportCard: {
    marginBottom: 12,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportedUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportDate: {
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
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  muteButton: {
    backgroundColor: '#8b5cf6',
  },
  suspendButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
