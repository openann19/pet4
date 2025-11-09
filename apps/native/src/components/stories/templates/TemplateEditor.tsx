import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { StoryTemplate } from './StoryTemplates';

interface TemplateEditorProps {
  visible: boolean;
  onClose: () => void;
  template: StoryTemplate;
  onSaveStory: (imageData: { template: StoryTemplate; text: string }) => void;
}

const FONT_SIZES = [24, 28, 32, 36, 40, 44];
const TEXT_ALIGNMENTS: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  visible,
  onClose,
  template: initialTemplate,
  onSaveStory,
}) => {
  const [text, setText] = useState('');
  const [template, setTemplate] = useState(initialTemplate);

  const handleSave = () => {
    if (!text.trim()) {
      Alert.alert('Missing Text', 'Please enter some text for your story');
      return;
    }

    onSaveStory({ template, text: text.trim() });
    setText('');
    onClose();
  };

  const handleClose = () => {
    setText('');
    setTemplate(initialTemplate);
    onClose();
  };

  const updateFontSize = (size: number) => {
    setTemplate({ ...template, fontSize: size });
  };

  const updateAlignment = (alignment: 'left' | 'center' | 'right') => {
    setTemplate({ ...template, alignment });
  };

  const getAlignmentIcon = (alignment: 'left' | 'center' | 'right'): string => {
    switch (alignment) {
      case 'left':
        return '⊣';
      case 'center':
        return '⊥';
      case 'right':
        return '⊢';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Story</Text>
          <Pressable onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.saveText]}>Save</Text>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: template.backgroundColor }]}>
          {template.icon && <Text style={styles.previewIcon}>{template.icon}</Text>}
          <Text
            style={[
              styles.previewText,
              {
                color: template.textColor,
                fontSize: template.fontSize,
                fontWeight: template.fontWeight,
                textAlign: template.alignment,
              },
            ]}
          >
            {text || 'Type your text...'}
          </Text>
        </View>

        {/* Text Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your text..."
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={150}
            autoFocus
          />
          <Text style={styles.charCount}>{text.length}/150</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Font Size */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Font Size</Text>
            <View style={styles.buttonRow}>
              {FONT_SIZES.map((size) => (
                <Pressable
                  key={size}
                  style={[styles.sizeButton, template.fontSize === size && styles.sizeButtonActive]}
                  onPress={() => updateFontSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      template.fontSize === size && styles.sizeButtonTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Alignment */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Alignment</Text>
            <View style={styles.buttonRow}>
              {TEXT_ALIGNMENTS.map((align) => (
                <Pressable
                  key={align}
                  style={[
                    styles.alignButton,
                    template.alignment === align && styles.alignButtonActive,
                  ]}
                  onPress={() => updateAlignment(align)}
                >
                  <Text
                    style={[
                      styles.alignButtonText,
                      template.alignment === align && styles.alignButtonTextActive,
                    ]}
                  >
                    {getAlignmentIcon(align)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Template Info */}
          <View style={styles.templateInfo}>
            <Text style={styles.templateInfoLabel}>Template:</Text>
            <Text style={styles.templateInfoValue}>{initialTemplate.name}</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    width: 60,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  saveText: {
    color: '#3b82f6',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 20,
  },
  previewIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  previewText: {
    maxWidth: '100%',
  },
  inputSection: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  controls: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlSection: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  sizeButtonTextActive: {
    color: '#ffffff',
  },
  alignButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  alignButtonActive: {
    backgroundColor: '#3b82f6',
  },
  alignButtonText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  alignButtonTextActive: {
    color: '#ffffff',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  templateInfoLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  templateInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
