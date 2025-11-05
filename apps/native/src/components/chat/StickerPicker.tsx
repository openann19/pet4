import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Pet-themed stickers
const STICKERS = [
  { id: '1', name: 'happy_dog', emoji: '🐶', category: 'dog' },
  { id: '2', name: 'happy_cat', emoji: '🐱', category: 'cat' },
  { id: '3', name: 'heart_eyes', emoji: '😍', category: 'love' },
  { id: '4', name: 'party', emoji: '🎉', category: 'celebrate' },
  { id: '5', name: 'paw', emoji: '🐾', category: 'pet' },
  { id: '6', name: 'bone', emoji: '🦴', category: 'dog' },
  { id: '7', name: 'fish', emoji: '🐟', category: 'cat' },
  { id: '8', name: 'ball', emoji: '⚽', category: 'play' },
  { id: '9', name: 'treat', emoji: '🍖', category: 'food' },
  { id: '10', name: 'love', emoji: '💕', category: 'love' },
  { id: '11', name: 'star', emoji: '⭐', category: 'celebrate' },
  { id: '12', name: 'fire', emoji: '🔥', category: 'hot' },
  { id: '13', name: 'thumbs_up', emoji: '👍', category: 'reaction' },
  { id: '14', name: 'clap', emoji: '👏', category: 'celebrate' },
  { id: '15', name: 'sparkle', emoji: '✨', category: 'celebrate' },
  { id: '16', name: 'rainbow', emoji: '🌈', category: 'happy' },
];

interface Sticker {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: Sticker) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const [search, setSearch] = useState('');
  const [recentStickers, setRecentStickers] = useState<Sticker[]>([]);

  const filteredStickers = STICKERS.filter((sticker) =>
    sticker.name.toLowerCase().includes(search.toLowerCase()) ||
    sticker.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectSticker = (sticker: Sticker) => {
    // Add to recent stickers
    const updatedRecent = [
      sticker,
      ...recentStickers.filter((s) => s.id !== sticker.id),
    ].slice(0, 8);
    setRecentStickers(updatedRecent);

    onSelectSticker(sticker);
    onClose();
  };

  const renderSticker = ({ item }: { item: Sticker }) => (
    <Pressable
      style={styles.stickerItem}
      onPress={() => handleSelectSticker(item)}
    >
      <Text style={styles.stickerEmoji}>{item.emoji}</Text>
    </Pressable>
  );

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
          <Text style={styles.title}>Stickers</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stickers..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearButton}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Stickers */}
        {recentStickers.length > 0 && search === '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.recentGrid}>
              {recentStickers.map((sticker) => (
                <Pressable
                  key={sticker.id}
                  style={styles.recentSticker}
                  onPress={() => handleSelectSticker(sticker)}
                >
                  <Text style={styles.recentStickerEmoji}>{sticker.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* All Stickers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {search ? `Results (${filteredStickers.length})` : 'All Stickers'}
          </Text>
        </View>

        <FlatList
          data={filteredStickers}
          renderItem={renderSticker}
          keyExtractor={(item) => item.id}
          numColumns={4}
          contentContainerStyle={styles.stickerGrid}
          showsVerticalScrollIndicator={false}
        />

        {filteredStickers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No stickers found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different search</Text>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    fontSize: 16,
    color: '#9ca3af',
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recentSticker: {
    width: 60,
    height: 60,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recentStickerEmoji: {
    fontSize: 32,
  },
  stickerGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stickerItem: {
    width: (width - 60) / 4,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stickerEmoji: {
    fontSize: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
