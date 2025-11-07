# PawfectMatch Deployment Guide

## Quick Start

### Development Environment

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

The app will be available at `http://localhost:5173`

### Seed Demo Data

The application automatically creates demo users on first load:

**Demo Accounts:**
- **User**: `user@demo.com` / `demo123`
- **Moderator**: `moderator@demo.com` / `demo123`
- **Admin**: `admin@demo.com` / `demo123`

Sample pets and matches are generated using AI on first initialization.

## Environment Configuration

### Switching Environments

The application automatically detects the environment based on hostname:

- `localhost` or `127.0.0.1` → **dev**
- `*.staging.*` → **staging**
- All other domains → **prod**

To manually override, use the config service:

```typescript
import { config } from '@/lib/config'

config.setEnv('staging')
```

### Environment Variables

Create `.env` files for each environment:

**.env.development**
```
VITE_COMMIT_SHA=local
VITE_BUILD_VERSION=1.0.0-dev
```

**.env.staging**
```
VITE_COMMIT_SHA=${CI_COMMIT_SHA}
VITE_BUILD_VERSION=1.0.0-rc
```

**.env.production**
```
VITE_COMMIT_SHA=${CI_COMMIT_SHA}
VITE_BUILD_VERSION=1.0.0
```

## Building for Production

### Build Command

```bash
npm run build
```

Output will be in `./dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Build Optimization

The production build:
- Minifies all JavaScript/CSS
- Tree-shakes unused code
- Optimizes images
- Generates source maps
- Includes service worker for PWA support

## Deployment Targets

### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
# Build
npm run build

# Deploy (example with Vercel)
vercel --prod
```

**Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t pawfectmatch .
docker run -p 8080:80 pawfectmatch
```

### CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_COMMIT_SHA: ${{ github.sha }}
          VITE_BUILD_VERSION: ${{ github.ref_name }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./dist
```

## Health Checks & Monitoring

### Health Endpoints

The application exposes simulated health endpoints for monitoring:

**Liveness Check** (`/healthz`)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "commitSha": "abc123"
}
```

**Readiness Check** (`/readyz`)
```json
{
  "status": "healthy",
  "checks": {
    "kv_storage": { "status": "healthy", "latency": 5 },
    "llm_api": { "status": "healthy", "latency": 120 }
  }
}
```

### Monitoring Integration

**Sentry (Error Tracking)**
```typescript
// Add to main.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: config.current.SENTRY_DSN,
  environment: config.current.ENV,
  release: config.current.BUILD_VERSION
})
```

**Analytics (Google Analytics, Mixpanel, etc.)**
```typescript
// Track events
analytics.track('match_created', {
  userId: user.id,
  petId: pet.id,
  compatibility: match.compatibilityScore
})
```

## Security Considerations

### Authentication

- JWT tokens stored securely (httpOnly cookies on web, secure storage on mobile)
- Token refresh flow prevents session expiration
- CSRF protection on state-changing requests
- Session revocation supported

### Data Protection

- All sensitive data encrypted at rest (Spark KV)
- HTTPS enforced in production
- Input sanitization on all user inputs
- Rate limiting on API endpoints

### RBAC (Role-Based Access Control)

- User: Standard pet owner permissions
- Moderator: Content moderation capabilities
- Admin: Full system access including analytics and feature flags

## Performance Optimization

### Code Splitting

React components are automatically code-split by route:

```typescript
const AdminConsole = lazy(() => import('./components/admin/AdminConsole'))
```

### Image Optimization

- WebP format with fallbacks
- Lazy loading for off-screen images
- Responsive images with srcset
- CDN delivery simulation

### Caching Strategy

- Service Worker caches static assets
- API responses cached with TTL
- KV storage for persistent data

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Slow Development Server

```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run dev
```

### KV Storage Issues

```bash
# Clear all stored data
# Open browser console:
await spark.kv.keys().then(keys => 
  Promise.all(keys.map(k => spark.kv.delete(k)))
)
```

## Migration to Real Backend

When ready to deploy with actual backend services:

1. **Replace Spark KV** → PostgreSQL/MongoDB
2. **Replace Simulated Realtime** → Socket.io/WebSocket server
3. **Add Real CDN** → Cloudinary/S3 for media uploads
4. **Deploy API Server** → Express/Fastify/NestJS
5. **Configure Push Notifications** → Firebase Cloud Messaging
6. **Set up Monitoring** → Sentry, DataDog, New Relic

See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) section "Production Deployment" for details.

## Support

For issues or questions:
- Check [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for technical details
- Review [PRD.md](./PRD.md) for feature documentation
- Open an issue on GitHub
