/**
 * Admin Console Screen (Mobile) - Enhanced
 *
 * Full-featured mobile admin console with navigation matching web AdminLayout.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpringConfig } from '../animations/springConfigs';
import { FadeInView } from '../components/FadeInView';
import { KYCManagementScreen } from './admin/KYCManagementScreen';
import { MapSettingsScreen } from './admin/MapSettingsScreen';
import { AdoptionManagementScreen } from './admin/AdoptionManagementScreen';
import { CommunityManagementScreen } from './admin/CommunityManagementScreen';
import { ChatModerationScreen } from './admin/ChatModerationScreen';
import { ConfigManagementScreen } from './admin/ConfigManagementScreen';
import { AuditLogScreen } from './admin/AuditLogScreen';
import { SupportChatScreen } from './admin/SupportChatScreen';
import { UserManagementScreen } from './admin/UserManagementScreen';
import type { AdminView } from '@petspark/shared';

// Screen width available if needed: Dimensions.get('window').width

interface MenuItem {
  id: AdminView;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'reports', label: 'Reports', icon: '🚩' },
  { id: 'moderation', label: 'Photo Moderation', icon: '👁️' },
  { id: 'content-moderation', label: 'Content Moderation', icon: '🛡️' },
  { id: 'chat-moderation', label: 'Chat Moderation', icon: '💬' },
  { id: 'support-chat', label: 'Support Tickets', icon: '🎧' },
  { id: 'kyc', label: 'KYC Verification', icon: '🆔' },
  { id: 'verification', label: 'Verification', icon: '✅' },
  { id: 'adoption', label: 'Adoption', icon: '❤️' },
  { id: 'adoption-applications', label: 'Adoption Applications', icon: '📋' },
  { id: 'adoption-listings', label: 'Adoption Listings', icon: '📝' },
  { id: 'community', label: 'Community', icon: '👥' },
  { id: 'lost-found', label: 'Lost & Found', icon: '🔍' },
  { id: 'live-streams', label: 'Live Streams', icon: '📺' },
  { id: 'map-settings', label: 'Map Settings', icon: '🗺️' },
  { id: 'config', label: 'Configuration', icon: '⚙️' },
  { id: 'audit', label: 'Audit Log', icon: '📜' },
  { id: 'settings', label: 'Settings', icon: '🔧' },
];

export const AdminConsoleScreen: React.FC = () => {
  const [selectedView, setSelectedView] = useState<AdminView>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuTranslateX = useSharedValue(-280);

  React.useEffect(() => {
    menuTranslateX.value = withSpring(menuOpen ? 0 : -280, SpringConfig.smooth);
  }, [menuOpen, menuTranslateX]);

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: menuTranslateX.value }],
  }));

  const renderView = () => {
    switch (selectedView) {
      case 'users':
        return <UserManagementScreen />;
      case 'kyc':
        return <KYCManagementScreen />;
      case 'map-settings':
        return <MapSettingsScreen />;
      case 'adoption':
      case 'adoption-listings':
        return <AdoptionManagementScreen />;
      case 'community':
        return <CommunityManagementScreen />;
      case 'chat-moderation':
        return <ChatModerationScreen />;
      case 'config':
        return <ConfigManagementScreen />;
      case 'audit':
        return <AuditLogScreen />;
      case 'support-chat':
        return <SupportChatScreen />;
      case 'dashboard':
      default:
        return (
          <View style={styles.dashboardContent}>
            <FadeInView delay={100}>
              <Text style={styles.sectionTitle}>Admin Dashboard</Text>
              <Text style={styles.sectionSubtitle}>
                Select a menu item to manage different aspects of the platform
              </Text>
            </FadeInView>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Console</Text>
          <Text style={styles.headerSubtitle}>
            {menuItems.find((m) => m.id === selectedView)?.label || 'Dashboard'}
          </Text>
        </View>
      </View>

      {/* Side Menu */}
      <Animated.View style={[styles.menu, menuStyle]}>
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Admin Menu</Text>
            <TouchableOpacity onPress={() => setMenuOpen(false)}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, selectedView === item.id && styles.menuItemActive]}
              onPress={() => {
                setSelectedView(item.id);
                setMenuOpen(false);
              }}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text
                style={[styles.menuItemText, selectedView === item.id && styles.menuItemTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>{renderView()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: '#111827',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    zIndex: 1000,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  menuScroll: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeIcon: {
    fontSize: 24,
    color: '#6b7280',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemActive: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  menuItemText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },
  menuItemTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  content: {
    flex: 1,
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
