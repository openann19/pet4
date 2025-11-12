import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import type { Story, StoryHighlight, Pet } from '@/lib/stories-types';
import { createStoryHighlight } from '@/lib/stories-utils';
import { useKV } from '@github/spark/hooks';

interface SaveToHighlightDialogProps {
  visible: boolean;
  onClose: () => void;
  story: Story;
  onSaved?: () => void;
}

export default function SaveToHighlightDialog({
  visible,
  onClose,
  story,
  onSaved,
}: SaveToHighlightDialogProps) {
  const [highlights, setHighlights] = useKV<StoryHighlight[]>('story-highlights', []);
  const [userPets] = useKV<Pet[]>('user-pets', []);
  const [showNewHighlight, setShowNewHighlight] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);

  const userHighlights = (highlights || []).filter((h) => h.userId === story.userId);
  const storyAlreadyInHighlight = (highlightId: string) => {
    const highlight = userHighlights.find((h) => h.id === highlightId);
    return highlight?.stories.some((s) => s.id === story.id) || false;
  };

  const handleSelectHighlight = (highlightId: string) => {
    if (storyAlreadyInHighlight(highlightId)) {
      Alert.alert('Story already in this highlight');
      return;
    }
    setSelectedHighlightId(highlightId);
  };

  const handleSaveToExisting = () => {
    if (!selectedHighlightId) return;
    setHighlights((current) =>
      (current || []).map((h) =>
        h.id === selectedHighlightId
          ? {
              ...h,
              stories: [...h.stories, story],
              updatedAt: new Date().toISOString(),
            }
          : h
      )
    );
    onSaved?.();
    onClose();
    resetState();
  };

  const handleCreateNew = () => {
    if (!newHighlightTitle.trim()) {
      Alert.alert('Please enter a highlight title');
      return;
    }
    const firstPet = userPets?.[0];
    const newHighlight = createStoryHighlight(
      story.userId,
      firstPet?.id || story.petId,
      newHighlightTitle,
      story.thumbnailUrl || story.mediaUrl,
      [story]
    );
    setHighlights((current) => [...(current || []), newHighlight]);
    onSaved?.();
    onClose();
    resetState();
  };

  const resetState = () => {
    setShowNewHighlight(false);
    setNewHighlightTitle('');
    setSelectedHighlightId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Save to Highlight</Text>
        {showNewHighlight ? (
          <View style={styles.newHighlightContainer}>
            <TextInput
              style={styles.input}
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              placeholder="Highlight Name"
              maxLength={30}
              autoFocus
            />
            <Image source={{ uri: story.thumbnailUrl || story.mediaUrl }} style={styles.preview} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => setShowNewHighlight(false)}>
                <Text>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !newHighlightTitle.trim() && styles.buttonDisabled]}
                onPress={handleCreateNew}
                disabled={!newHighlightTitle.trim()}
              >
                <Text>Create Highlight</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={userHighlights}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>No highlights yet. Create your first highlight to save this story.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const alreadyInHighlight = storyAlreadyInHighlight(item.id);
              const isSelected = selectedHighlightId === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.highlightItem,
                    alreadyInHighlight && styles.disabledHighlight,
                    isSelected && styles.selectedHighlight,
                  ]}
                  onPress={() => !alreadyInHighlight && handleSelectHighlight(item.id)}
                  disabled={alreadyInHighlight}
                >
                  <Image source={{ uri: item.coverImage }} style={styles.avatar} />
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightCount}>
                      {item.stories.length} {item.stories.length === 1 ? 'story' : 'stories'}
                    </Text>
                    {alreadyInHighlight && <Text style={styles.alreadyAdded}>Already added</Text>}
                  </View>
                  {isSelected && !alreadyInHighlight && <Text style={styles.check}>✔️</Text>}
                  {item.isPinned && <Text style={styles.pin}>📌</Text>}
                </TouchableOpacity>
              );
            }}
          />
        )}
        <View style={styles.footer}>
          {showNewHighlight ? null : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => setShowNewHighlight(true)}>
                <Text>New Highlight</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !selectedHighlightId && styles.buttonDisabled]}
                onPress={handleSaveToExisting}
                disabled={!selectedHighlightId}
              >
                <Text>Save Story</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  newHighlightContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '80%',
    marginBottom: 16,
  },
  preview: { width: 120, height: 180, borderRadius: 12, marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginTop: 16 },
  button: { padding: 12, backgroundColor: '#eee', borderRadius: 8, marginHorizontal: 8 },
  buttonDisabled: { backgroundColor: '#ddd' },
  list: { flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  disabledHighlight: { opacity: 0.5 },
  selectedHighlight: { backgroundColor: '#cce5ff' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  highlightInfo: { flex: 1 },
  highlightTitle: { fontWeight: 'bold' },
  highlightCount: { color: '#888' },
  alreadyAdded: { color: '#d00', fontSize: 12 },
  check: { fontSize: 20, color: '#007aff', marginLeft: 8 },
  pin: { fontSize: 18, marginLeft: 8 },
  footer: { paddingVertical: 12 },
});
