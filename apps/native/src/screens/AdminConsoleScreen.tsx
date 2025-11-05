import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FadeInView } from '../components/FadeInView';
import { AnimatedCard } from '../components/AnimatedCard';
import { SpringConfig } from '../animations/springConfigs';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  delay: number;
}

const AnimatedStatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color, delay }) => {
  const scale = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { ...SpringConfig.bouncy, delay });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, { borderLeftColor: color }, animatedStyle]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
};

export const AdminConsoleScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'reports' | 'moderation'>(
    'overview'
  );

  const tabIndicatorPosition = useSharedValue(0);

  const handleTabPress = (tab: typeof selectedTab, index: number) => {
    setSelectedTab(tab);
    tabIndicatorPosition.value = withSpring(index * (width / 4), SpringConfig.snappy);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Console</Text>
          <Text style={styles.headerSubtitle}>Monitor and manage platform</Text>
        </View>
      </FadeInView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('overview', 0)}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('users', 1)}
        >
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('reports', 2)}
        >
          <Text style={[styles.tabText, selectedTab === 'reports' && styles.tabTextActive]}>
            Reports
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('moderation', 3)}
        >
          <Text style={[styles.tabText, selectedTab === 'moderation' && styles.tabTextActive]}>
            Moderation
          </Text>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <View>
            {/* Key Metrics */}
            <FadeInView delay={100}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
            </FadeInView>

            <View style={styles.statsGrid}>
              <AnimatedStatCard
                title="Total Users"
                value="12,458"
                subtitle="+342 this week"
                color="#3b82f6"
                delay={150}
              />
              <AnimatedStatCard
                title="Active Matches"
                value="3,921"
                subtitle="+127 today"
                color="#22c55e"
                delay={200}
              />
              <AnimatedStatCard
                title="Messages Sent"
                value="45,230"
                subtitle="+2.4K today"
                color="#8b5cf6"
                delay={250}
              />
              <AnimatedStatCard
                title="Adoptions"
                value="1,847"
                subtitle="+23 this week"
                color="#f59e0b"
                delay={300}
              />
            </View>

            {/* Recent Activity */}
            <FadeInView delay={350}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </FadeInView>

            {[
              { user: 'Sarah M.', action: 'Created a new account', time: '2 min ago', icon: '👤' },
              { user: 'Mike K.', action: 'Matched with Luna', time: '5 min ago', icon: '💕' },
              { user: 'Emma R.', action: 'Posted in Community', time: '12 min ago', icon: '📝' },
              { user: 'John D.', action: 'Adopted Charlie', time: '1 hour ago', icon: '🏠' },
            ].map((activity, index) => (
              <FadeInView key={index} delay={400 + index * 50}>
                <AnimatedCard style={styles.activityCard}>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <View style={styles.activityText}>
                      <Text style={styles.activityUser}>{activity.user}</Text>
                      <Text style={styles.activityAction}>{activity.action}</Text>
                    </View>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </AnimatedCard>
              </FadeInView>
            ))}
          </View>
        )}

        {selectedTab === 'users' && (
          <View>
            <FadeInView delay={100}>
              <Text style={styles.sectionTitle}>User Management</Text>
            </FadeInView>

            {[
              { name: 'Sarah Mitchell', email: 'sarah.m@example.com', status: 'Active', pets: 2 },
              { name: 'Mike Johnson', email: 'mike.j@example.com', status: 'Active', pets: 1 },
              { name: 'Emma Roberts', email: 'emma.r@example.com', status: 'Suspended', pets: 3 },
            ].map((user, index) => (
              <FadeInView key={index} delay={150 + index * 50}>
                <AnimatedCard style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitial}>{user.name[0]}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        user.status === 'Active' ? styles.statusActive : styles.statusSuspended,
                      ]}
                    >
                      <Text style={styles.statusText}>{user.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.userPets}>{user.pets} pets registered</Text>
                </AnimatedCard>
              </FadeInView>
            ))}
          </View>
        )}

        {selectedTab === 'reports' && (
          <View>
            <FadeInView delay={100}>
              <Text style={styles.sectionTitle}>Reported Content</Text>
            </FadeInView>

            {[
              { type: 'Profile', reason: 'Inappropriate content', severity: 'High', id: '#2847' },
              { type: 'Post', reason: 'Spam', severity: 'Medium', id: '#2846' },
              { type: 'Message', reason: 'Harassment', severity: 'High', id: '#2845' },
            ].map((report, index) => (
              <FadeInView key={index} delay={150 + index * 50}>
                <AnimatedCard style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportType}>{report.type}</Text>
                    <View
                      style={[
                        styles.severityBadge,
                        report.severity === 'High' ? styles.severityHigh : styles.severityMedium,
                      ]}
                    >
                      <Text style={styles.severityText}>{report.severity}</Text>
                    </View>
                  </View>
                  <Text style={styles.reportReason}>{report.reason}</Text>
                  <Text style={styles.reportId}>Report {report.id}</Text>
                </AnimatedCard>
              </FadeInView>
            ))}
          </View>
        )}

        {selectedTab === 'moderation' && (
          <View>
            <FadeInView delay={100}>
              <Text style={styles.sectionTitle}>Moderation Queue</Text>
            </FadeInView>

            {[
              { content: 'New adoption listing pending approval', priority: 'Normal' },
              { content: 'Lost pet report requires verification', priority: 'Urgent' },
              { content: 'Community post flagged for review', priority: 'Normal' },
            ].map((item, index) => (
              <FadeInView key={index} delay={150 + index * 50}>
                <AnimatedCard style={styles.moderationCard}>
                  <Text style={styles.moderationContent}>{item.content}</Text>
                  <View style={styles.moderationActions}>
                    <TouchableOpacity style={styles.approveButton}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedCard>
              </FadeInView>
            ))}
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: width / 4,
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 13,
    color: '#6b7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusSuspended: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
  },
  userPets: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityHigh: {
    backgroundColor: '#fee2e2',
  },
  severityMedium: {
    backgroundColor: '#fef3c7',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
  },
  reportReason: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  reportId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moderationCard: {
    marginBottom: 12,
  },
  moderationContent: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  moderationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
  },
  approveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
