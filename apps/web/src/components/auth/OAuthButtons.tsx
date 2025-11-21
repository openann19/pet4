/**
 * OAuth Buttons Component
 *
 * Provides Google and Apple sign-in buttons with proper styling and accessibility.
 */

// Using inline SVGs for Google and Apple logos
import { analytics } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';

const logger = createLogger('OAuthButtons');

interface GoogleAuthorizeResponse {
  url?: string;
}

interface AppleAuthorizationPayload {
  code?: string;
  id_token?: string;
}

function getAuthorizeUrl(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const typed = data as GoogleAuthorizeResponse;
  return typeof typed.url === 'string' ? typed.url : null;
}

function hasAppleAuthorization(value: unknown): value is AppleAuthorizationPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as AppleAuthorizationPayload;
  return typeof payload.code === 'string' || typeof payload.id_token === 'string';
}

function isAppleAuth(value: unknown): value is AppleIDAuth {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AppleIDAuth>;
  return typeof candidate.init === 'function' && typeof candidate.signIn === 'function';
}

function getAppleAuth(): AppleIDAuth | null {
  if (typeof window !== 'undefined') {
    const authCandidate = window.AppleID?.auth;
    if (isAppleAuth(authCandidate)) {
      return authCandidate;
    }
  }
  return null;
}

async function parseOAuthResponse(response: Response, provider: 'google' | 'apple'): Promise<unknown> {
  const rawBody = await response.text();

  if (!rawBody) {
    logger.warn(`${provider} OAuth response body empty`);
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    logger.error(`${provider} OAuth response JSON parse failed`, { error: errorMessage });
    return null;
  }
}

function isAppleCredential(value: unknown): value is AppleIDCredential {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const credential = value as Partial<AppleIDCredential>;

  const { authorization, user } = credential;

  if (authorization !== undefined) {
    if (typeof authorization !== 'object' || authorization === null) {
      return false;
    }

    const auth = authorization as Record<string, unknown>;
    if (auth.code !== undefined && typeof auth.code !== 'string') {
      return false;
    }
    if (auth.id_token !== undefined && typeof auth.id_token !== 'string') {
      return false;
    }
  }

  if (user !== undefined && (typeof user !== 'object' || user === null)) {
    return false;
  }

  return true;
}

// Google Logo SVG component
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

interface OAuthButtonsProps {
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  disabled?: boolean;
}

export default function OAuthButtons({
  onGoogleSignIn,
  onAppleSignIn,
  disabled = false,
}: OAuthButtonsProps) {
  const handleGoogleSignIn = async () => {
    if (disabled) return;

    haptics.trigger('selection');
    analytics.track('oauth_clicked', { provider: 'google' });

    try {
      const response = await fetch('/api/v1/auth/oauth/google/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await parseOAuthResponse(response, 'google');
        const url = getAuthorizeUrl(data);
        if (url) {
          window.location.href = url;
          return;
        }
      }

      onGoogleSignIn?.();
    } catch (error) {
      logger.error('Google OAuth error', error instanceof Error ? error : new Error(String(error)));
      onGoogleSignIn?.();
    }
  };

  const handleAppleSignIn = async () => {
    if (disabled) return;

    haptics.trigger('selection');
    analytics.track('oauth_clicked', { provider: 'apple' });

    try {
      const appleAuth = getAppleAuth();
      if (appleAuth) {
        const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
        if (!clientId) {
          logger.error('Missing Apple client ID');
          onAppleSignIn?.();
          return;
        }

        await appleAuth.init({
          clientId,
          scope: 'name email',
          redirectURI: window.location.origin + '/api/v1/auth/oauth/apple/callback',
          usePopup: true,
        });

        const credentialRaw: unknown = await appleAuth.signIn();

        if (!isAppleCredential(credentialRaw)) {
          logger.warn('Apple sign-in returned unexpected payload', {
            type: typeof credentialRaw,
            hasAuthorization: Boolean(
              typeof credentialRaw === 'object' &&
              credentialRaw !== null &&
              'authorization' in credentialRaw
            ),
          });
          onAppleSignIn?.();
          return;
        }

        const authorization = credentialRaw.authorization;

        if (hasAppleAuthorization(authorization)) {
          onAppleSignIn?.();
          return;
        }
        logger.warn('Apple sign-in missing authorization payload', {
          hasAuthorization: typeof authorization === 'object' && authorization !== null,
          hasCode:
            typeof authorization === 'object' &&
            authorization !== null &&
            'code' in authorization &&
            typeof (authorization as { code?: unknown }).code === 'string',
          hasIdToken:
            typeof authorization === 'object' &&
            authorization !== null &&
            'id_token' in authorization &&
            typeof (authorization as { id_token?: unknown }).id_token === 'string',
        });
        onAppleSignIn?.();
        return;
      }

      window.location.href = '/api/v1/auth/oauth/apple/authorize';
    } catch (error) {
      logger.error('Apple OAuth error', error instanceof Error ? error : new Error(String(error)));
      onAppleSignIn?.();
    }
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => { void handleGoogleSignIn(); }}
        disabled={disabled}
        className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-(--border-light) rounded-xl text-sm font-medium text-(--text-primary) hover:bg-(--muted) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-(--color-focus-ring) focus:ring-offset-2"
        aria-label="Sign in with Google"
      >
        <GoogleLogo size={18} aria-hidden="true" />
        <span>Google</span>
      </button>

      <button
        type="button"
        onClick={() => { void handleAppleSignIn(); }}
        disabled={disabled}
        className="flex-1 h-12 flex items-center justify-center gap-2 bg-(--color-neutral-12) border border-(--color-neutral-12) rounded-xl text-sm font-medium text-white hover:bg-(--color-neutral-11) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Sign in with Apple"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        <span>Apple</span>
      </button>
    </div>
  );
}
