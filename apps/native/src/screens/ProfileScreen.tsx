import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { UserProfile, Pet } from '../types';
import { useStorage } from '../hooks/use-storage';
import { useNavigation } from '@react-navigation/native';
import { PricingModal, SubscriptionStatusCard, BillingIssueBanner } from '../components/payments';
import { useSubscription } from '../hooks/payments/useSubscription';
import { StoryHighlights, CreateHighlightDialog, type Highlight } from '../components/stories';
import { useHighlights } from '../hooks/stories/useHighlights';

export default function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [userProfile] = useStorage<UserProfile>('user-profile', {
    id: 'user-1',
    name: 'Pet Owner',
    email: 'owner@pet3.com',
    location: 'San Francisco, CA',
    pets: [],
    createdAt: new Date().toISOString(),
    bio: 'Loving pet parent looking for playmates!',
  });
  const [userPets] = useStorage<Pet[]>('user-pets', []);

  // Subscription management
  const {
    subscription,
    billingIssue,
    subscribe,
    cancelSubscription,
    updatePaymentMethod,
    dismissBillingIssue,
  } = useSubscription();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Highlights management
  const { highlights, createHighlight } = useHighlights(userProfile.id);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);

  const handleCreateHighlight = async (title: string, storyIds: string[], coverImage: string) => {
    const result = await createHighlight(title, storyIds, coverImage);
    if (result.success) {
      Alert.alert('Success', 'Highlight created successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to create highlight');
    }
  };

  const handleHighlightPress = (highlight: Highlight) => {
    Alert.alert(highlight.title, `${highlight.storyIds.length} stories in this highlight`);
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      // Downgrade/cancel subscription
      const result = await cancelSubscription();
      if (result.success) {
        Alert.alert('Success', 'Subscription cancelled successfully');
      }
    } else {
      // Upgrade to premium/elite
      const result = await subscribe(planId as 'premium' | 'elite');
      if (result.success) {
        Alert.alert('Success', `Subscribed to ${planId} successfully!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to subscribe');
      }
    }
  };

  const handleManageSubscription = () => {
    Alert.alert('Manage Subscription', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Cancel Subscription',
        style: 'destructive',
        onPress: async () => {
          const result = await cancelSubscription();
          if (result.success) {
            Alert.alert('Success', 'Subscription cancelled');
          }
        },
      },
      {
        text: 'Update Payment',
        onPress: async () => {
          const result = await updatePaymentMethod();
          if (result.success) {
            Alert.alert('Success', 'Payment method updated');
          }
        },
      },
    ]);
  };

  const renderPetCard = (pet: Pet) => (
    <View key={pet.id} style={styles.petCard}>
      <Image source={{ uri: pet.photo }} style={styles.petImage} />
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>{pet.breed}</Text>
        <Text style={styles.petAge}>{pet.age} years old</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {userProfile.avatar && <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />}
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.location}>📍 {userProfile.location}</Text>
        {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
      </View>

      {/* Story Highlights */}
      <StoryHighlights
        highlights={highlights}
        onHighlightPress={handleHighlightPress}
        onAddHighlight={() => setShowCreateHighlight(true)}
        isOwner={true}
      />

      {/* Billing Issue Banner */}
      {billingIssue && (
        <BillingIssueBanner
          issue={billingIssue}
          onUpdatePayment={updatePaymentMethod}
          onDismiss={dismissBillingIssue}
        />
      )}

      {/* Subscription Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <SubscriptionStatusCard
          subscription={subscription}
          onManage={handleManageSubscription}
          onUpgrade={() => setShowPricingModal(true)}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Pet</Text>
          </TouchableOpacity>
        </View>
        {userPets.length === 0 ? (
          <View style={styles.emptyPets}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>No pets added yet</Text>
          </View>
        ) : (
          userPets.map(renderPetCard)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Playdates' as never)}
        >
          <Text style={styles.settingText}>📅 Playdates</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Map' as never)}
        >
          <Text style={styles.settingText}>🗺️ Map View</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Notifications' as never)}
        >
          <Text style={styles.settingText}>🔔 Notifications</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('SavedPosts' as never)}
        >
          <Text style={styles.settingText}>📖 Saved Posts</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.settingText}>⚙️ Settings</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Edit Profile</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Privacy</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Help & Support</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Pricing Modal */}
      <PricingModal
        visible={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
        currentPlan={subscription.plan}
      />

      {/* Create Highlight Dialog */}
      <CreateHighlightDialog
        visible={showCreateHighlight}
        onClose={() => setShowCreateHighlight(false)}
        onCreateHighlight={handleCreateHighlight}
        availableStories={[]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  petCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  petInfo: {
    justifyContent: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 14,
    color: '#999',
  },
  emptyPets: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 24,
    color: '#999',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4458',
    fontWeight: '600',
  },
});
