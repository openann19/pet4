/**
 * OAuth Buttons Component
 * 
 * Provides Google and Apple sign-in buttons with proper styling and accessibility.
 */

import { motion } from '@petspark/motion'
// Using inline SVGs for Google and Apple logos
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'

// Google Logo SVG component
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

interface OAuthButtonsProps {
  onGoogleSignIn?: () => void
  onAppleSignIn?: () => void
  disabled?: boolean
}

export default function OAuthButtons({ 
  onGoogleSignIn, 
  onAppleSignIn,
  disabled = false 
}: OAuthButtonsProps) {
  const { t } = useApp()

  const handleGoogleSignIn = async () => {
    if (disabled) return
    
    haptics.trigger('selection')
    analytics.track('oauth_clicked', { provider: 'google' })

    try {
      // Redirect to Google OAuth
      const response = await fetch('/api/v1/auth/oauth/google/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        } else if (onGoogleSignIn) {
          onGoogleSignIn()
        }
      } else if (onGoogleSignIn) {
        onGoogleSignIn()
      }
    } catch (error) {
      const logger = createLogger('OAuthButtons')
      logger.error('Google OAuth error', error instanceof Error ? error : new Error(String(error)))
      if (onGoogleSignIn) {
        onGoogleSignIn()
      }
    }
  }

  const handleAppleSignIn = async () => {
    if (disabled) return
    
    haptics.trigger('selection')
    analytics.track('oauth_clicked', { provider: 'apple' })

    try {
      // Use Apple Sign In API if available
      if (window.AppleID && window.AppleID.auth) {
        await window.AppleID.auth.init({
          clientId: import.meta.env['VITE_APPLE_CLIENT_ID'],
          scope: 'name email',
          redirectURI: window.location.origin + '/api/v1/auth/oauth/apple/callback',
          usePopup: true,
        })

        const response = await window.AppleID.auth.signIn()
        if (response && response.authorization) {
          // Handle successful sign in
          if (onAppleSignIn) {
            onAppleSignIn()
          }
        }
      } else if (onAppleSignIn) {
        // Fallback to redirect
        window.location.href = '/api/v1/auth/oauth/apple/authorize'
      }
    } catch (error) {
      const logger = createLogger('OAuthButtons')
      logger.error('Apple OAuth error', error instanceof Error ? error : new Error(String(error)))
      if (onAppleSignIn) {
        onAppleSignIn()
      }
    }
  }

  return (
    <div className="space-y-3">
      <MotionView
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleSignIn}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 h-12 border-2"
        >
          <GoogleLogo size={20} />
          <span className="font-semibold">
            {'Continue with Google'}
          </span>
        </Button>
      </MotionView>

      <MotionView
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAppleSignIn}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 h-12 border-2 bg-black text-white hover:bg-black/90 hover:text-white"
        >
          <span className="font-semibold">
            {t.auth?.signInWithApple || 'Continue with Apple'}
          </span>
        </Button>
      </MotionView>
    </div>
  )
}

