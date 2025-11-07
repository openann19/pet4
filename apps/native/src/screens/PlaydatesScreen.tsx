import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { PlaydatesList, PlaydateScheduler, type Playdate, type PlaydateData } from '../components/playdate';
import { usePlaydates } from '../hooks/playdate/usePlaydates';
import { isTruthy, isDefined } from '@/core/guards';

export default function PlaydatesScreen(): React.JSX.Element {
  const [showScheduler, setShowScheduler] = useState(false);
  const {
    playdates,
    createPlaydate,
    updateRSVP,
    cancelPlaydate,
  } = usePlaydates();

  const handleSchedulePlaydate = async (data: PlaydateData) => {
    const result = await createPlaydate(data);
    if (isTruthy(result.success)) {
      Alert.alert('Success', 'Playdate scheduled successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to schedule playdate');
    }
  };

  const handlePlaydatePress = (playdate: Playdate) => {
    Alert.alert(
      playdate.title,
      String(playdate.notes || 'No additional notes' ?? ''),
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Cancel Playdate',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelPlaydate(playdate.id);
            if (isTruthy(result.success)) {
              Alert.alert('Cancelled', 'Playdate has been cancelled');
            }
          },
        },
      ]
    );
  };

  const handleRSVP = async (playdateId: string, response: 'yes' | 'no' | 'maybe') => {
    const result = await updateRSVP(playdateId, response);
    if (isTruthy(result.success)) {
      const responseText = response === 'yes' ? 'confirmed' : response === 'no' ? 'declined' : 'marked as maybe';
      Alert.alert('RSVP Updated', `You've ${String(responseText ?? '')} for this playdate`);
    } else {
      Alert.alert('Error', result.error || 'Failed to update RSVP');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Playdates</Text>
          <Text style={styles.subtitle}>
            {playdates.length} total playdate{playdates.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => { setShowScheduler(true); }}
        >
          <Text style={styles.addButtonIcon}>+</Text>
        </Pressable>
      </View>

      {/* List */}
      <PlaydatesList
        playdates={playdates}
        onPlaydatePress={handlePlaydatePress}
        onRSVP={handleRSVP}
      />

      {/* Scheduler Modal */}
      <PlaydateScheduler
        visible={showScheduler}
        onClose={() => { setShowScheduler(false); }}
        onSchedule={handleSchedulePlaydate}
        matchId="match-123"
        matchName="Buddy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
});
