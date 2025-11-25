import { StyleSheet } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'
import { tokens } from '../../tokens'

export const createSelectStyles = (
  variant: ComponentVariant = 'default',
  size: ComponentSize = 'medium',
  disabled: boolean = false,
  error: boolean = false
) => {
  const sizeConfig = {
    small: {
      height: tokens.sizing.touch.small,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.typography.body.small.fontSize,
      lineHeight: tokens.typography.body.small.lineHeight,
      borderRadius: tokens.borderRadius.sm,
    },
    medium: {
      height: tokens.sizing.touch.medium,
      paddingHorizontal: tokens.spacing.lg,
      fontSize: tokens.typography.body.medium.fontSize,
      lineHeight: tokens.typography.body.medium.lineHeight,
      borderRadius: tokens.borderRadius.md,
    },
    large: {
      height: tokens.sizing.touch.large,
      paddingHorizontal: tokens.spacing.xl,
      fontSize: tokens.typography.body.large.fontSize,
      lineHeight: tokens.typography.body.large.lineHeight,
      borderRadius: tokens.borderRadius.lg,
    },
  }

  const variantConfig = {
    default: {
      backgroundColor: tokens.colors.background.primary,
      borderColor: tokens.colors.border.primary,
      borderWidth: 1,
    },
    filled: {
      backgroundColor: tokens.colors.background.secondary,
      borderColor: 'transparent',
      borderWidth: 1,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: tokens.colors.border.primary,
      borderWidth: 2,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 1,
    },
  }

  const currentSize = sizeConfig[size]
  const currentVariant = variantConfig[variant]

  return StyleSheet.create({
    container: {
      width: '100%',
    },

    label: {
      fontSize: tokens.typography.caption.fontSize,
      lineHeight: tokens.typography.caption.lineHeight,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.xs,
    },

    requiredIndicator: {
      color: tokens.colors.semantic.error,
      marginLeft: tokens.spacing.xs,
    },

    trigger: {
      height: currentSize.height,
      paddingHorizontal: currentSize.paddingHorizontal,
      paddingVertical: tokens.spacing.sm,
      backgroundColor: currentVariant.backgroundColor,
      borderColor: error ? tokens.colors.semantic.error : currentVariant.borderColor,
      borderWidth: currentVariant.borderWidth,
      borderRadius: currentSize.borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: tokens.colors.shadow.primary,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      opacity: disabled ? 0.5 : 1,
    },

    triggerPressed: {
      backgroundColor: tokens.colors.background.pressed,
    },

    triggerFocused: {
      borderColor: error ? tokens.colors.semantic.error : tokens.colors.accent.primary,
      shadowColor: error ? tokens.colors.semantic.error : tokens.colors.accent.primary,
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },

    triggerText: {
      flex: 1,
      fontSize: currentSize.fontSize,
      lineHeight: currentSize.lineHeight,
      color: tokens.colors.text.primary,
      fontWeight: tokens.typography.weights.normal,
    },

    placeholderText: {
      color: tokens.colors.text.placeholder,
    },

    selectedChip: {
      backgroundColor: tokens.colors.accent.primary,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.full,
      marginRight: tokens.spacing.xs,
      marginBottom: tokens.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },

    selectedChipText: {
      fontSize: tokens.typography.caption.fontSize,
      color: tokens.colors.accent.contrast,
      fontWeight: tokens.typography.weights.medium,
      marginRight: tokens.spacing.xs,
    },

    selectedChipRemove: {
      padding: tokens.spacing.xs / 2,
      borderRadius: tokens.borderRadius.full,
    },

    chevronIcon: {
      marginLeft: tokens.spacing.sm,
      color: tokens.colors.text.secondary,
    },

    helperText: {
      fontSize: tokens.typography.caption.fontSize,
      lineHeight: tokens.typography.caption.lineHeight,
      color: error ? tokens.colors.semantic.error : tokens.colors.text.secondary,
      marginTop: tokens.spacing.xs,
    },

    // Modal styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay.dark,
      justifyContent: 'flex-end',
    },

    modalContent: {
      backgroundColor: tokens.colors.background.primary,
      borderTopLeftRadius: tokens.borderRadius.xl,
      borderTopRightRadius: tokens.borderRadius.xl,
      paddingTop: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xl,
      maxHeight: '80%',
      shadowColor: tokens.colors.shadow.primary,
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: tokens.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border.secondary,
      marginBottom: tokens.spacing.md,
    },

    modalTitle: {
      fontSize: tokens.typography.heading.small.fontSize,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.primary,
    },

    closeButton: {
      padding: tokens.spacing.sm,
      borderRadius: tokens.borderRadius.md,
      backgroundColor: tokens.colors.background.secondary,
    },

    searchContainer: {
      marginBottom: tokens.spacing.md,
    },

    searchInput: {
      height: tokens.sizing.touch.medium,
      paddingHorizontal: tokens.spacing.md,
      backgroundColor: tokens.colors.background.secondary,
      borderRadius: tokens.borderRadius.md,
      fontSize: tokens.typography.body.medium.fontSize,
      color: tokens.colors.text.primary,
    },

    optionsList: {
      maxHeight: 400,
    },

    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.borderRadius.md,
      minHeight: tokens.sizing.touch.medium,
    },

    optionPressed: {
      backgroundColor: tokens.colors.background.pressed,
    },

    optionSelected: {
      backgroundColor: tokens.colors.accent.surface,
    },

    optionDisabled: {
      opacity: 0.5,
    },

    optionIcon: {
      marginRight: tokens.spacing.md,
    },

    optionContent: {
      flex: 1,
    },

    optionLabel: {
      fontSize: tokens.typography.body.medium.fontSize,
      lineHeight: tokens.typography.body.medium.lineHeight,
      color: tokens.colors.text.primary,
      fontWeight: tokens.typography.weights.normal,
    },

    optionLabelSelected: {
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.accent.primary,
    },

    optionDescription: {
      fontSize: tokens.typography.caption.fontSize,
      color: tokens.colors.text.secondary,
      marginTop: tokens.spacing.xs / 2,
    },

    checkmarkIcon: {
      marginLeft: tokens.spacing.md,
      color: tokens.colors.accent.primary,
    },

    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing.xl * 2,
    },

    emptyText: {
      fontSize: tokens.typography.body.medium.fontSize,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
    },

    multiSelectSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },

    selectedCount: {
      fontSize: tokens.typography.body.medium.fontSize,
      color: tokens.colors.text.primary,
      fontWeight: tokens.typography.weights.medium,
    },
  })
}
