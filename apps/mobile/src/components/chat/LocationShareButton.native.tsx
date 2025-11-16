/**
 * LocationShareButton.native Component
 *
 * Mobile location share button with native geolocation
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';

interface LocationShareButtonProps {
  onLocationShare: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  disabled?: boolean;
}

export function LocationShareButton({
  onLocationShare,
  disabled = false,
}: LocationShareButtonProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const bounce = useBounceOnTap({ scale: 0.95 });

  const handlePress = useCallback(async () => {
    if (disabled || isLoading) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();

    try {
      setIsLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to share your location.'
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      let address: string | undefined;
      try {
        const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (result) {
          address = [
            result.street,
            result.city,
            result.region,
            result.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        // Ignore geocoding errors
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLocationShare({
        latitude,
        longitude,
        ...(address !== undefined ? { address } : {}),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
      console.error('Location error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, bounce, onLocationShare]);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={styles.icon}>📍</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 20,
  },
});

