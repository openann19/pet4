import { useState, useCallback, useMemo } from 'react'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('useViewMode')

type ViewMode = 'cards' | 'map' | 'list' | 'grid'

interface UseViewModeOptions {
  initialMode?: ViewMode
  availableModes?: ViewMode[]
  onModeChange?: (mode: ViewMode) => void
}

export function useViewMode({
  initialMode = 'cards',
  availableModes = ['cards', 'map'],
  onModeChange,
}: UseViewModeOptions = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)

  const setMode = useCallback((mode: ViewMode) => {
    if (!availableModes.includes(mode)) {
      logger.warn(`View mode "${String(mode ?? '')}" is not available. Available modes: ${String(availableModes.join(', ') ?? '')}`)
      return
    }
    
    haptics.trigger('selection')
    setViewMode(mode)
    onModeChange?.(mode)
  }, [availableModes, onModeChange])

  const toggleMode = useCallback(() => {
    const currentIndex = availableModes.indexOf(viewMode)
    const nextIndex = (currentIndex + 1) % availableModes.length
    const nextMode = availableModes[nextIndex]
    if (isTruthy(nextMode)) {
      setMode(nextMode)
    }
  }, [viewMode, availableModes, setMode])

  const isMode = useCallback((mode: ViewMode) => {
    return viewMode === mode
  }, [viewMode])

  const canSwitchTo = useMemo(() => {
    return (mode: ViewMode) => availableModes.includes(mode)
  }, [availableModes])

  return {
    viewMode,
    setMode,
    toggleMode,
    isMode,
    canSwitchTo,
    availableModes,
  }
}

