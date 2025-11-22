# Server Security Headers Configuration

This document provides configuration examples for setting security headers in production web servers.

## Required Security Headers

For production deployment, configure your web server with the following headers:

### Nginx Configuration

Add to your `nginx.conf` or site configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name pawfectmatch.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.pawfectmatch.com https://api.mapbox.com; connect-src 'self' https://api.pawfectmatch.com wss://api.pawfectmatch.com https://api.stripe.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob: https://*.pawfectmatch.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" always;

    # Root directory
    root /var/www/pawfectmatch/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Configuration

Add to your `.htaccess` or virtual host configuration:

```apache
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(self)"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.pawfectmatch.com https://api.mapbox.com; connect-src 'self' https://api.pawfectmatch.com wss://api.pawfectmatch.com https://api.stripe.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob: https://*.pawfectmatch.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
</IfModule>
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.pawfectmatch.com https://api.mapbox.com; connect-src 'self' https://api.pawfectmatch.com wss://api.pawfectmatch.com https://api.stripe.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob: https://*.pawfectmatch.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

### Netlify Configuration

Create `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(self)"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.pawfectmatch.com https://api.mapbox.com; connect-src 'self' https://api.pawfectmatch.com wss://api.pawfectmatch.com https://api.stripe.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob: https://*.pawfectmatch.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
```

## Verification

Test your headers using:

```bash
curl -I https://pawfectmatch.com
```

Or use online tools:
- https://securityheaders.com
- https://observatory.mozilla.org

## Header Explanations

- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Content-Security-Policy**: Prevents XSS and injection attacks

