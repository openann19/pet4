import React, { useState, useCallback } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Alert, AccessibilityInfo } from 'react-native';
import type { Story, StoryHighlight, Pet } from '@shared/types';
import { createStoryHighlight } from '@shared/utils';
// import { useKV } from '@github/spark/hooks'; // TODO: replace with unified data hook
// import { t } from '@/lib/i18n'; // TODO: replace with actual i18n
// import { useThemeTokens } from '@/core/tokens'; // TODO: replace with actual tokens

interface SaveToHighlightDialogProps {
  visible: boolean;
  onClose: () => void;
  story: Story;
  onSaved?: () => void;
}

const SaveToHighlightDialog: React.FC<SaveToHighlightDialogProps> = ({ visible, onClose, story, onSaved }) => {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]); // TODO: wire to data layer
  const [userPets] = useState<Pet[]>([]); // TODO: wire to data layer
  const [showNewHighlight, setShowNewHighlight] = useState<boolean>(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState<string>('');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  // const tokens = useThemeTokens();

  const userHighlights = (highlights || []).filter((h: StoryHighlight) => h.userId === story.userId);
  const storyAlreadyInHighlight = useCallback((highlightId: string): boolean => {
    const highlight = userHighlights.find((h: StoryHighlight) => h.id === highlightId);
    return highlight?.stories.some((s: Story) => s.id === story.id) || false;
  }, [userHighlights, story.id]);

  const handleSelectHighlight = useCallback((highlightId: string) => {
    if (storyAlreadyInHighlight(highlightId)) {
      Alert.alert('Story already in this highlight');
      return;
    }
    setSelectedHighlightId(highlightId);
  }, [storyAlreadyInHighlight]);

  const handleSaveToExisting = useCallback(() => {
    if (!selectedHighlightId) return;
    setHighlights((current: StoryHighlight[]) =>
      (current || []).map((h: StoryHighlight) =>
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
  }, [selectedHighlightId, setHighlights, story, onSaved, onClose]);

  const handleCreateNew = useCallback(() => {
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
    setHighlights((current: StoryHighlight[]) => [...(current || []), newHighlight]);
    onSaved?.();
    onClose();
    resetState();
  }, [newHighlightTitle, userPets, story, setHighlights, onSaved, onClose]);

  const resetState = useCallback(() => {
    setShowNewHighlight(false);
    setNewHighlightTitle('');
    setSelectedHighlightId(null);
  }, []);

  // Accessibility: focus management
  React.useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility('Save to Highlight dialog opened');
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} accessible accessibilityLabel={'Save to Highlight Dialog'}>
      <View style={styles.container}> 
        <Text style={styles.title} accessibilityRole="header">
          {'Save to Highlight'}
        </Text>
        {showNewHighlight ? (
          <View style={styles.newHighlightContainer}>
            <TextInput
              style={styles.input}
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              placeholder={'Highlight Name'}
              maxLength={30}
              autoFocus
              accessibilityLabel={'Highlight Name'}
            />
            <Image
              source={{ uri: story.thumbnailUrl || story.mediaUrl }}
              style={styles.preview}
              accessibilityLabel={'Story preview'}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => setShowNewHighlight(false)} accessibilityRole="button">
                <Text>{'Back'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !newHighlightTitle.trim() && styles.buttonDisabled]}
                onPress={handleCreateNew}
                disabled={!newHighlightTitle.trim()}
                accessibilityRole="button"
              >
                <Text>{'Create Highlight'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={userHighlights}
            keyExtractor={(item: StoryHighlight) => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>{'No highlights yet. Create your first highlight to save this story.'}</Text>
              </View>
            }
            renderItem={({ item }: { item: StoryHighlight }) => {
              const alreadyInHighlight = storyAlreadyInHighlight(item.id);
              const isSelected = selectedHighlightId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.highlightItem, alreadyInHighlight && styles.disabledHighlight, isSelected && styles.selectedHighlight]}
                  onPress={() => !alreadyInHighlight && handleSelectHighlight(item.id)}
                  disabled={alreadyInHighlight}
                  accessibilityRole="button"
                  accessibilityLabel={'Highlight ' + item.title}
                >
                  <Image source={{ uri: item.coverImage }} style={styles.avatar} accessibilityLabel={'Highlight cover image'} />
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightCount}>{item.stories.length} {item.stories.length === 1 ? 'story' : 'stories'}</Text>
                    {alreadyInHighlight && <Text style={styles.alreadyAdded}>{'Already added'}</Text>}
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
              <TouchableOpacity style={styles.button} onPress={() => setShowNewHighlight(true)} accessibilityRole="button">
                <Text>{'New Highlight'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !selectedHighlightId && styles.buttonDisabled]}
                onPress={handleSaveToExisting}
                disabled={!selectedHighlightId}
                accessibilityRole="button"
              >
                <Text>{'Save Story'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  newHighlightContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, width: '80%', marginBottom: 16 },
  preview: { width: 120, height: 180, borderRadius: 12, marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginTop: 16 },
  button: { padding: 12, backgroundColor: '#eee', borderRadius: 8, marginHorizontal: 8 },
  buttonDisabled: { backgroundColor: '#ddd' },
  list: { flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#f9f9f9' },
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

export default React.memo(SaveToHighlightDialog);
