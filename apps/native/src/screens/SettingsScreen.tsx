import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import { useStorage } from '../hooks/useStorage';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useStorage(
    'notificationsEnabled',
    true
  );
  const [soundEnabled, setSoundEnabled] = useStorage('soundEnabled', true);
  const [vibrationEnabled, setVibrationEnabled] = useStorage('vibrationEnabled', true);
  const [locationSharing, setLocationSharing] = useStorage('locationSharing', false);
  const [darkMode, setDarkMode] = useStorage('darkMode', false);
  const [language, setLanguage] = useStorage('language', 'en');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert('Success', 'You have been logged out');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted');
          },
        },
      ]
    );
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <FadeInView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </FadeInView>
  );

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <AnimatedCard style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>{icon}</Text>
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {showChevron && onPress && <Text style={styles.chevron}>›</Text>}
        </View>
      </AnimatedCard>
    </TouchableOpacity>
  );

  const SettingToggle = ({
    icon,
    label,
    value,
    onValueChange,
  }: {
    icon: string;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <AnimatedCard style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
        thumbColor={value ? '#6366f1' : '#F3F4F6'}
      />
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Manage your preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title="Account">
          <SettingRow
            icon="👤"
            label="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Coming soon!')}
          />
          <SettingRow
            icon="🔐"
            label="Privacy"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
          />
          <SettingRow
            icon="🛡️"
            label="Security"
            onPress={() => Alert.alert('Security', 'Security settings coming soon!')}
          />
        </SettingSection>

        <SettingSection title="Notifications">
          <SettingToggle
            icon="🔔"
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <SettingToggle
            icon="🔊"
            label="Sound"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          <SettingToggle
            icon="📳"
            label="Vibration"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </SettingSection>

        <SettingSection title="Privacy">
          <SettingToggle
            icon="📍"
            label="Location Sharing"
            value={locationSharing}
            onValueChange={setLocationSharing}
          />
          <SettingRow
            icon="🔒"
            label="Blocked Users"
            value="0"
            onPress={() => Alert.alert('Blocked Users', 'No blocked users')}
          />
        </SettingSection>

        <SettingSection title="Appearance">
          <SettingToggle
            icon="🌙"
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingRow
            icon="🌍"
            label="Language"
            value={language === 'en' ? 'English' : 'Other'}
            onPress={() =>
              Alert.alert('Language', 'Language selector coming soon!')
            }
          />
        </SettingSection>

        <SettingSection title="Video Calls">
          <SettingRow
            icon="📹"
            label="Video Quality"
            value="1080p"
            onPress={() => Alert.alert('Video Quality', 'Quality settings coming soon!')}
          />
          <SettingRow
            icon="🎥"
            label="Camera Preferences"
            onPress={() => Alert.alert('Camera', 'Camera settings coming soon!')}
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingRow
            icon="ℹ️"
            label="Help & Support"
            onPress={() => Alert.alert('Help', 'Support coming soon!')}
          />
          <SettingRow
            icon="📄"
            label="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of Service')}
          />
          <SettingRow
            icon="🔐"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy Policy')}
          />
          <SettingRow
            icon="📱"
            label="App Version"
            value="1.0.0"
            showChevron={false}
          />
        </SettingSection>

        <View style={styles.dangerSection}>
          <FadeInView delay={400}>
            <AnimatedButton onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </AnimatedButton>
          </FadeInView>

          <FadeInView delay={450}>
            <AnimatedButton
              onPress={handleDeleteAccount}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
            </AnimatedButton>
          </FadeInView>
        </View>
      </ScrollView>
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
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  dangerSection: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
    gap: 12,
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
