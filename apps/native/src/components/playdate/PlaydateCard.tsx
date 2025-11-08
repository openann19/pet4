import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export interface Playdate {
  id: string;
  title: string;
  date: string;
  time: string;
  location: {
    name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  duration: number;
  notes?: string;
  attendees: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdBy: string;
  currentUserRSVP?: 'yes' | 'no' | 'maybe';
}

interface PlaydateCardProps {
  playdate: Playdate;
  onPress: () => void;
  onRSVP?: (response: 'yes' | 'no' | 'maybe') => void;
}

export const PlaydateCard: React.FC<PlaydateCardProps> = ({ playdate, onPress, onRSVP }) => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string): string => {
    const time = new Date(timeStr);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {playdate.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(playdate.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(playdate.status)}</Text>
          </View>
        </View>
      </View>

      {/* Date & Time */}
      <View style={styles.row}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.infoText}>
          {formatDate(playdate.date)} at {formatTime(playdate.time)}
        </Text>
      </View>

      {/* Duration */}
      <View style={styles.row}>
        <Text style={styles.icon}>⏱️</Text>
        <Text style={styles.infoText}>
          {playdate.duration < 60
            ? `${playdate.duration} minutes`
            : `${playdate.duration / 60} hour${playdate.duration > 60 ? 's' : ''}`}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.row}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.infoText} numberOfLines={1}>
          {playdate.location.name}
        </Text>
      </View>

      {/* Attendees */}
      <View style={styles.row}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.infoText}>
          {playdate.attendees.length + 1} attendee{playdate.attendees.length > 0 ? 's' : ''}
        </Text>
      </View>

      {/* RSVP Buttons */}
      {onRSVP && playdate.status === 'pending' && (
        <View style={styles.rsvpContainer}>
          <Text style={styles.rsvpLabel}>Your response:</Text>
          <View style={styles.rsvpButtons}>
            <Pressable
              style={[
                styles.rsvpButton,
                playdate.currentUserRSVP === 'yes' && styles.rsvpButtonYes,
              ]}
              onPress={() => onRSVP('yes')}
            >
              <Text
                style={[
                  styles.rsvpButtonText,
                  playdate.currentUserRSVP === 'yes' && styles.rsvpButtonTextActive,
                ]}
              >
                ✓ Going
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.rsvpButton,
                playdate.currentUserRSVP === 'maybe' && styles.rsvpButtonMaybe,
              ]}
              onPress={() => onRSVP('maybe')}
            >
              <Text
                style={[
                  styles.rsvpButtonText,
                  playdate.currentUserRSVP === 'maybe' && styles.rsvpButtonTextActive,
                ]}
              >
                ? Maybe
              </Text>
            </Pressable>
            <Pressable
              style={[styles.rsvpButton, playdate.currentUserRSVP === 'no' && styles.rsvpButtonNo]}
              onPress={() => onRSVP('no')}
            >
              <Text
                style={[
                  styles.rsvpButtonText,
                  playdate.currentUserRSVP === 'no' && styles.rsvpButtonTextActive,
                ]}
              >
                ✕ Can't Go
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Confirmed RSVP */}
      {playdate.currentUserRSVP && playdate.status === 'confirmed' && (
        <View style={styles.confirmedRSVP}>
          <Text style={styles.confirmedIcon}>✓</Text>
          <Text style={styles.confirmedText}>You're going!</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  icon: {
    fontSize: 16,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  rsvpContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  rsvpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  rsvpButtonYes: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  rsvpButtonMaybe: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  rsvpButtonNo: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  rsvpButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  rsvpButtonTextActive: {
    color: '#111827',
  },
  confirmedRSVP: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  confirmedIcon: {
    fontSize: 16,
    color: '#10b981',
  },
  confirmedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});
