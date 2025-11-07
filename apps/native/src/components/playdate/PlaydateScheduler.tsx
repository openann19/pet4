import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isTruthy, isDefined } from '@/core/guards';

export interface PlaydateData {
  title: string;
  date: Date;
  time: Date;
  location: {
    name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  duration: number; // in minutes
  notes?: string;
  attendees: string[];
}

interface PlaydateSchedulerProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (playdate: PlaydateData) => void;
  matchId: string;
  matchName: string;
}

const DURATIONS = [30, 60, 90, 120, 180];

export const PlaydateScheduler: React.FC<PlaydateSchedulerProps> = ({
  visible,
  onClose,
  onSchedule,
  matchId,
  matchName,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSchedule = () => {
    if (!title.trim() || !locationName.trim()) {
      return;
    }

    const playdateData: PlaydateData = {
      title: title.trim(),
      date,
      time,
      location: {
        name: locationName.trim(),
      },
      duration,
      notes: notes.trim(),
      attendees: [matchId],
    };

    onSchedule(playdateData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setTime(new Date());
    setDuration(60);
    setLocationName('');
    setNotes('');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Schedule Playdate</Text>
          <Pressable
            onPress={handleSchedule}
            style={[
              styles.scheduleButton,
              (!title.trim() || !locationName.trim()) && styles.scheduleButtonDisabled,
            ]}
            disabled={!title.trim() || !locationName.trim()}
          >
            <Text
              style={[
                styles.scheduleText,
                (!title.trim() || !locationName.trim()) && styles.scheduleTextDisabled,
              ]}
            >
              Schedule
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* With */}
          <View style={styles.section}>
            <Text style={styles.label}>With</Text>
            <View style={styles.attendeeCard}>
              <View style={styles.attendeeAvatar}>
                <Text style={styles.attendeeAvatarText}>
                  {matchName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.attendeeName}>{matchName}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning walk at the park"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => { setShowDatePicker(true); }}
              >
                <Text style={styles.dateTimeIcon}>📅</Text>
                <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              </Pressable>

              <Pressable
                style={styles.dateTimeButton}
                onPress={() => { setShowTimePicker(true); }}
              >
                <Text style={styles.dateTimeIcon}>🕐</Text>
                <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
              </Pressable>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((dur) => (
                <Pressable
                  key={dur}
                  style={[
                    styles.durationButton,
                    duration === dur && styles.durationButtonActive,
                  ]}
                  onPress={() => { setDuration(dur); }}
                >
                  <Text
                    style={[
                      styles.durationText,
                      duration === dur && styles.durationTextActive,
                    ]}
                  >
                    {dur < 60 ? `${String(dur ?? '')}m` : `${String(dur / 60 ?? '')}h`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Central Park"
              placeholderTextColor="#9ca3af"
              value={locationName}
              onChangeText={setLocationName}
            />
            <Pressable style={styles.mapButton}>
              <Text style={styles.mapButtonIcon}>📍</Text>
              <Text style={styles.mapButtonText}>Choose on map</Text>
            </Pressable>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any details or instructions..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (isTruthy(selectedDate)) {
                setDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (isTruthy(selectedTime)) {
                setTime(selectedTime);
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  scheduleButton: {
    paddingVertical: 8,
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  scheduleTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesInput: {
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateTimeIcon: {
    fontSize: 20,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  durationButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  durationTextActive: {
    color: '#1e40af',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mapButtonIcon: {
    fontSize: 16,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
