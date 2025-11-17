import { Pressable, Text } from 'react-native'

export interface StickerButtonProps {
  sticker: { id: string; emoji: string }
  onSelect: (emoji: string) => void
}

export function StickerButton({ sticker, onSelect }: StickerButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => { onSelect(sticker.emoji); }}
      style={{ padding: 8, borderRadius: 12 }}
    >
      <Text style={{ fontSize: 24 }}>{sticker.emoji}</Text>
    </Pressable>
  )
}

export interface ReactionButtonProps {
  emoji: string
  onClick?: () => void
}

export function ReactionButton({ emoji, onClick }: ReactionButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onClick}
      style={{ padding: 8, borderRadius: 12 }}
    >
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </Pressable>
  )
}

export function SendButtonIcon(): JSX.Element {
  // Minimal mobile icon placeholder; the actual icon is provided elsewhere in RN UI
  return <Text accessibilityLabel="Send">➤</Text>
}
