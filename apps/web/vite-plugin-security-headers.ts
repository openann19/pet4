import type { Plugin } from 'vite';

/**
 * Vite plugin to add security headers to the preview server
 * Note: For production, configure these headers in your web server (nginx, Apache, etc.)
 */
export function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // HSTS - only in production (check via env var)
        const isProduction =
          process.env.VITE_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';
        if (isProduction) {
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
          );
        }

        // Content Security Policy
        const connectSources = [
          "'self'",
          'https://api.pawfectmatch.com',
          'wss://api.pawfectmatch.com',
          'https://api.stripe.com',
          'https://api.mapbox.com',
        ];

        // Permit local API only during development previews
        if (!isProduction) {
          connectSources.push('http://localhost:3000', 'http://localhost:3001');
        }

        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com",
          "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
          "img-src 'self' data: blob: https: https://*.pawfectmatch.com https://api.mapbox.com",
          `connect-src ${connectSources.join(' ')}`,
          "font-src 'self' https://fonts.gstatic.com data:",
          "media-src 'self' blob: https://*.pawfectmatch.com",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          'upgrade-insecure-requests',
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);

        next();
      });
    },
  };
}
