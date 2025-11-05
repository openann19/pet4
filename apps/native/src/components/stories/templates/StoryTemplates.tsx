import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const TEMPLATE_WIDTH = (width - 48) / 2;

export interface StoryTemplate {
  id: string;
  name: string;
  category: 'pet' | 'celebration' | 'announcement' | 'mood' | 'custom';
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
  alignment: 'left' | 'center' | 'right';
  icon?: string;
  pattern?: 'dots' | 'lines' | 'gradient' | 'solid';
}

const TEMPLATES: StoryTemplate[] = [
  // Pet Category
  {
    id: 'pet_1',
    name: 'Pawsome',
    category: 'pet',
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    fontSize: 32,
    fontWeight: '800',
    alignment: 'center',
    icon: '🐾',
    pattern: 'solid',
  },
  {
    id: 'pet_2',
    name: 'Good Boy',
    category: 'pet',
    backgroundColor: '#dbeafe',
    textColor: '#1e40af',
    fontSize: 28,
    fontWeight: '700',
    alignment: 'center',
    icon: '🐶',
    pattern: 'solid',
  },
  {
    id: 'pet_3',
    name: 'Meow Time',
    category: 'pet',
    backgroundColor: '#fce7f3',
    textColor: '#9f1239',
    fontSize: 30,
    fontWeight: '700',
    alignment: 'center',
    icon: '🐱',
    pattern: 'solid',
  },
  {
    id: 'pet_4',
    name: 'Pet Love',
    category: 'pet',
    backgroundColor: '#fee2e2',
    textColor: '#991b1b',
    fontSize: 28,
    fontWeight: '800',
    alignment: 'center',
    icon: '❤️',
    pattern: 'solid',
  },
  // Celebration Category
  {
    id: 'celebration_1',
    name: 'Birthday',
    category: 'celebration',
    backgroundColor: '#c7d2fe',
    textColor: '#3730a3',
    fontSize: 32,
    fontWeight: '900',
    alignment: 'center',
    icon: '🎂',
    pattern: 'solid',
  },
  {
    id: 'celebration_2',
    name: 'Party Time',
    category: 'celebration',
    backgroundColor: '#fbcfe8',
    textColor: '#831843',
    fontSize: 30,
    fontWeight: '800',
    alignment: 'center',
    icon: '🎉',
    pattern: 'solid',
  },
  // Announcement Category
  {
    id: 'announcement_1',
    name: 'Big News',
    category: 'announcement',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    alignment: 'center',
    icon: '📢',
    pattern: 'solid',
  },
  {
    id: 'announcement_2',
    name: 'Important',
    category: 'announcement',
    backgroundColor: '#f59e0b',
    textColor: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    alignment: 'center',
    icon: '⚠️',
    pattern: 'solid',
  },
  // Mood Category
  {
    id: 'mood_1',
    name: 'Happy',
    category: 'mood',
    backgroundColor: '#fef08a',
    textColor: '#713f12',
    fontSize: 36,
    fontWeight: '800',
    alignment: 'center',
    icon: '😊',
    pattern: 'solid',
  },
  {
    id: 'mood_2',
    name: 'Grateful',
    category: 'mood',
    backgroundColor: '#d1fae5',
    textColor: '#065f46',
    fontSize: 28,
    fontWeight: '700',
    alignment: 'center',
    icon: '🙏',
    pattern: 'solid',
  },
  {
    id: 'mood_3',
    name: 'Excited',
    category: 'mood',
    backgroundColor: '#fecaca',
    textColor: '#7f1d1d',
    fontSize: 32,
    fontWeight: '900',
    alignment: 'center',
    icon: '🤩',
    pattern: 'solid',
  },
  {
    id: 'mood_4',
    name: 'Chill',
    category: 'mood',
    backgroundColor: '#bae6fd',
    textColor: '#075985',
    fontSize: 26,
    fontWeight: '600',
    alignment: 'center',
    icon: '😎',
    pattern: 'solid',
  },
];

interface StoryTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StoryTemplate) => void;
}

type CategoryFilter = 'all' | 'pet' | 'celebration' | 'announcement' | 'mood';

export const StoryTemplates: React.FC<StoryTemplatesProps> = ({
  visible,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: StoryTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const renderTemplate = ({ item }: { item: StoryTemplate }) => (
    <Pressable
      style={styles.templateItem}
      onPress={() => handleSelectTemplate(item)}
    >
      <View
        style={[
          styles.templatePreview,
          { backgroundColor: item.backgroundColor },
        ]}
      >
        {item.icon && (
          <Text style={styles.templateIcon}>{item.icon}</Text>
        )}
        <Text
          style={[
            styles.templateText,
            {
              color: item.textColor,
              fontSize: item.fontSize * 0.5,
              fontWeight: item.fontWeight,
              textAlign: item.alignment,
            },
          ]}
        >
          Your Text
        </Text>
      </View>
      <Text style={styles.templateName}>{item.name}</Text>
    </Pressable>
  );

  const renderCategoryButton = (
    category: CategoryFilter,
    label: string,
    icon: string
  ) => (
    <Pressable
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category && styles.categoryTextActive,
        ]}
      >
        {label}
      </Text>
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
          <View style={styles.headerLeft}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Story Templates</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {renderCategoryButton('all', 'All', '✨')}
            {renderCategoryButton('pet', 'Pet', '🐾')}
            {renderCategoryButton('celebration', 'Celebration', '🎉')}
            {renderCategoryButton('announcement', 'News', '📢')}
            {renderCategoryButton('mood', 'Mood', '😊')}
          </View>
        </View>

        {/* Templates Grid */}
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={filteredTemplates}
            renderItem={renderTemplate}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
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
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
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
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  categoriesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  templatesSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  gridContent: {
    paddingBottom: 20,
  },
  templateItem: {
    width: TEMPLATE_WIDTH,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  templatePreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  templateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  templateText: {
    textAlign: 'center',
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
