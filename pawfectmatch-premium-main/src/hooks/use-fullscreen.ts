/**
 * Hook for managing fullscreen state
 */

import { useState, useEffect, useCallback } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleChange)
    document.addEventListener('webkitfullscreenchange', handleChange)
    document.addEventListener('mozfullscreenchange', handleChange)
    document.addEventListener('MSFullscreenChange', handleChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('webkitfullscreenchange', handleChange)
      document.removeEventListener('mozfullscreenchange', handleChange)
      document.removeEventListener('MSFullscreenChange', handleChange)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    const element = document.documentElement

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ('webkitRequestFullscreen' in element && typeof (element as { webkitRequestFullscreen?: () => Promise<void> })['webkitRequestFullscreen'] === 'function') {
        await (element as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
      } else if ('mozRequestFullScreen' in element && typeof (element as { mozRequestFullScreen?: () => Promise<void> })['mozRequestFullScreen'] === 'function') {
        await (element as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen()
      } else if ('msRequestFullscreen' in element && typeof (element as { msRequestFullscreen?: () => Promise<void> })['msRequestFullscreen'] === 'function') {
        await (element as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen()
      }
    } catch (error) {
      // Fullscreen not supported or blocked
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ('webkitExitFullscreen' in document && typeof (document as { webkitExitFullscreen?: () => Promise<void> })['webkitExitFullscreen'] === 'function') {
        await (document as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen()
      } else if ('mozCancelFullScreen' in document && typeof (document as { mozCancelFullScreen?: () => Promise<void> })['mozCancelFullScreen'] === 'function') {
        await (document as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen()
      } else if ('msExitFullscreen' in document && typeof (document as { msExitFullscreen?: () => Promise<void> })['msExitFullscreen'] === 'function') {
        await (document as { msExitFullscreen: () => Promise<void> }).msExitFullscreen()
      }
    } catch (error) {
      // Fullscreen exit failed
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  }
}

