import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import type { StoryItem } from '../StoriesBar';
import { isTruthy, isDefined } from '@/core/guards';

interface Story {
  id: string;
  imageUri: string;
  createdAt: string;
}

interface CreateHighlightDialogProps {
  visible: boolean;
  onClose: () => void;
  onCreateHighlight: (title: string, selectedStoryIds: string[], coverImage: string) => void;
  availableStories: Story[];
}

export const CreateHighlightDialog: React.FC<CreateHighlightDialogProps> = ({
  visible,
  onClose,
  onCreateHighlight,
  availableStories,
}) => {
  const [title, setTitle] = useState('');
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [coverImage, setCoverImage] = useState<string>('');

  const handleStoryToggle = (storyId: string, imageUri: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
      // If this was the cover image, clear it
      if (coverImage === imageUri) {
        setCoverImage('');
      }
    } else {
      newSelected.add(storyId);
      // Auto-select as cover if it's the first one
      if (newSelected.size === 1) {
        setCoverImage(imageUri);
      }
    }
    setSelectedStories(newSelected);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your highlight');
      return;
    }

    if (selectedStories.size === 0) {
      Alert.alert('No Stories Selected', 'Please select at least one story');
      return;
    }

    onCreateHighlight(title.trim(), Array.from(selectedStories), coverImage);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setSelectedStories(new Set());
    setCoverImage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isSelected = selectedStories.has(item.id);
    const isCover = coverImage === item.imageUri;

    return (
      <Pressable
        style={[styles.storyItem, isSelected && styles.storyItemSelected]}
        onPress={() => { handleStoryToggle(item.id, item.imageUri); }}
        onLongPress={() => {
          if (isTruthy(isSelected)) {
            setCoverImage(item.imageUri);
          }
        }}
      >
        <Image source={{ uri: item.imageUri }} style={styles.storyImage} />
        
        {/* Selection Indicator */}
        <View style={styles.selectionOverlay}>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
          {isCover && (
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>Cover</Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.storyDate}>
          <Text style={styles.storyDateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Highlight</Text>
          <Pressable
            onPress={handleCreate}
            style={[
              styles.createButton,
              (!title.trim() || selectedStories.size === 0) &&
                styles.createButtonDisabled,
            ]}
            disabled={!title.trim() || selectedStories.size === 0}
          >
            <Text
              style={[
                styles.createText,
                (!title.trim() || selectedStories.size === 0) &&
                  styles.createTextDisabled,
              ]}
            >
              Create
            </Text>
          </Pressable>
        </View>

        {/* Title Input */}
        <View style={styles.titleSection}>
          <Text style={styles.label}>Highlight Name</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="e.g., Summer Adventures"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={30}
            autoFocus
          />
          <Text style={styles.charCount}>
            {title.length}/30
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Select Stories</Text>
          <Text style={styles.instructionsText}>
            Tap to select stories • Long press to set as cover
          </Text>
          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              {selectedStories.size} selected
            </Text>
          </View>
        </View>

        {/* Stories Grid */}
        {availableStories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No Stories Available</Text>
            <Text style={styles.emptyText}>
              Create some stories first to add them to highlights
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableStories}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  createButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  createTextDisabled: {
    color: '#9ca3af',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 6,
  },
  instructionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  selectedCount: {
    alignSelf: 'flex-start',
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  gridContent: {
    padding: 12,
  },
  storyItem: {
    flex: 1,
    aspectRatio: 9 / 16,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storyItemSelected: {
    borderColor: '#3b82f6',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 8,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  selectedBadgeText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  coverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  storyDate: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storyDateText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 20,
  },
});
