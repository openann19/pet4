import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { createLogger } from '../../utils/logger';

const logger = createLogger('LocationShare');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationShareProps {
  visible: boolean;
  onClose: () => void;
  onSendLocation: (location: LocationData) => void;
}

export const LocationShare: React.FC<LocationShareProps> = ({
  visible,
  onClose,
  onSendLocation,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to share your location.');
        onClose();
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(locationData);

      // Reverse geocode to get address
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          if (addr) {
            const formattedAddress = [addr.street, addr.city, addr.region, addr.country]
              .filter(Boolean)
              .join(', ');
            setAddress(formattedAddress);
            locationData.address = formattedAddress;
            setLocation(locationData);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to get address', err, {
          context: 'reverseGeocode',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLocation = () => {
    if (location) {
      onSendLocation(location);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : location ? (
            <View style={styles.content}>
              {/* Map Preview (Placeholder) */}
              <View style={styles.mapPreview}>
                <Text style={styles.mapIcon}>🗺️</Text>
                <Text style={styles.mapText}>Map Preview</Text>
              </View>

              {/* Location Info */}
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Your Location</Text>
                {address ? (
                  <Text style={styles.addressText}>{address}</Text>
                ) : (
                  <Text style={styles.coordsText}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable style={styles.refreshButton} onPress={getCurrentLocation}>
                  <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </Pressable>
                <Pressable style={styles.sendButton} onPress={handleSendLocation}>
                  <Text style={styles.sendButtonText}>Send Location</Text>
                </Pressable>
              </View>

              {/* Info Text */}
              <Text style={styles.infoText}>
                Your match will see your approximate location on a map
              </Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to get location</Text>
              <Pressable style={styles.retryButton} onPress={getCurrentLocation}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 20,
  },
  mapPreview: {
    height: 200,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  coordsText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  refreshButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sendButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
