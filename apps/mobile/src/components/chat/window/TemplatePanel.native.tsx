import { Pressable, Text, View, StyleSheet, ScrollView } from 'react-native'
import type { MessageTemplate } from '@/lib/chat-types'
import { MESSAGE_TEMPLATES } from '@/lib/chat-types'

export interface TemplatePanelProps {
  onClose: () => void
  onSelect: (t: MessageTemplate) => void
}

export function TemplatePanel({ onClose, onSelect }: TemplatePanelProps): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Message Templates</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close templates"
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.content}>
        {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
          <Pressable
            key={template.id}
            onPress={() => { onSelect(template); }}
            style={styles.templateItem}
            accessibilityRole="button"
            accessibilityLabel={`Select template: ${String(template.text ?? '')}`}
          >
            {template.icon && <Text style={styles.icon}>{template.icon}</Text>}
            <View style={styles.templateContent}>
              {template.title && <Text style={styles.templateTitle}>{template.title}</Text>}
              <Text style={styles.templateText}>{template.text || template.content}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 200,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontWeight: '600',
    fontSize: 13,
    color: 'white',
    marginBottom: 2,
  },
  templateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
})
