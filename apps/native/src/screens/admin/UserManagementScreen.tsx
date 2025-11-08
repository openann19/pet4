/**
 * User Management Screen (Mobile)
 *
 * Mobile admin screen for managing users, including password reset functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createLogger } from '../../utils/logger';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';

const logger = createLogger('UserManagementScreen');

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
}

export const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetMode, setResetMode] = useState<'email' | 'manual'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Note: getUserDetails requires userId, so we use empty array for now
      // When backend provides list endpoint, update to: await mobileAdminApi.getUsers(filter);
      setUsers([]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load users', err, { context: 'loadUsers', filter });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setResettingPassword(true);
      await mobileAdminApi.resetUserPassword(selectedUser.id, {
        sendEmail: resetMode === 'email',
        ...(resetMode === 'manual' && newPassword ? { newPassword } : {}),
      });
      setResetPasswordModalOpen(false);
      setNewPassword('');
      setResetMode('email');
      await loadUsers();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reset password', err, {
        context: 'handleResetPassword',
        userId: selectedUser.id,
        resetMode,
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === 'all') return true;
    return u.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'suspended':
        return '#f59e0b';
      case 'banned':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage users and permissions</Text>
        </View>
      </FadeInView>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'suspended', 'banned'] as const).map((f) => (
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
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user, index) => (
            <FadeInView key={user.id} delay={index * 50}>
              <AnimatedCard style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(user.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                      {user.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.resetPasswordButton}
                  onPress={() => {
                    setSelectedUser(user);
                    setResetPasswordModalOpen(true);
                  }}
                >
                  <Text style={styles.resetPasswordText}>Reset Password</Text>
                </TouchableOpacity>
              </AnimatedCard>
            </FadeInView>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={resetPasswordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setResetPasswordModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Reset password for {selectedUser?.name || selectedUser?.email}
            </Text>

            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeButton, resetMode === 'email' && styles.modeButtonActive]}
                onPress={() => setResetMode('email')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    resetMode === 'email' && styles.modeButtonTextActive,
                  ]}
                >
                  Send Reset Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, resetMode === 'manual' && styles.modeButtonActive]}
                onPress={() => setResetMode('manual')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    resetMode === 'manual' && styles.modeButtonTextActive,
                  ]}
                >
                  Set New Password
                </Text>
              </TouchableOpacity>
            </View>

            {resetMode === 'manual' && (
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setResetPasswordModalOpen(false);
                  setNewPassword('');
                  setResetMode('email');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  (resettingPassword || (resetMode === 'manual' && newPassword.length < 8)) &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={resettingPassword || (resetMode === 'manual' && newPassword.length < 8)}
              >
                <Text style={styles.confirmButtonText}>
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetPasswordButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetPasswordText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
