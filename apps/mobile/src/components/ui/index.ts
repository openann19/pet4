/**
 * Mobile UI Components Index
 *
 * Enhanced mobile components with web component parity
 *
 * Architecture Note: Components are located in apps/mobile (not packages/ui-mobile)
 * due to react-native-reanimated import restrictions in packages. The ui-mobile package
 * has stricter linting rules that prevent direct reanimated imports, while apps/mobile
 * allows them following the existing Dialog component pattern.
 */

// Enhanced components with web parity
export { MobileButton } from './Button/Button'
export type { MobileButtonProps } from './Button/Button'

export { MobileInput } from './Input/Input'
export type { MobileInputProps } from './Input/Input'

// Test component for validation
export { ComponentTest } from './ComponentTest'

// Legacy exports (existing components)
export {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog'

// Re-export existing components for convenience
export { default as SaveToHighlightDialog } from '../stories/SaveToHighlightDialog'
export { default as SignInForm } from '../auth/SignInForm'
export { PostComposer } from '../community/PostComposer'
