# PETSPARK Backend

Backend API server for PETSPARK application.

## Features

- GDPR-compliant data export and deletion
- Consent management
- TypeScript with strict mode
- Express.js with proper error handling
- Structured logging
- Request validation with Zod

## Endpoints

### GDPR Endpoints

- `POST /api/gdpr/export` - Export user data
- `POST /api/gdpr/delete` - Delete user data
- `GET /api/gdpr/consent?userId={userId}` - Get consent status
- `POST /api/gdpr/consent` - Update consent

### Health Check

- `GET /health` - Health check endpoint

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000` by default.

### Build

```bash
pnpm build
```

### Run Production Server

```bash
pnpm start
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

### Test

```bash
pnpm test
```

## Authentication

For development, authentication can be bypassed using the `x-user-id` header:

```bash
curl -H "x-user-id: user1" http://localhost:3000/api/gdpr/consent?userId=user1
```

For production, implement proper JWT token validation in `src/middleware/auth.ts`.

## Database

The current implementation uses a mock in-memory database (`MockDatabase`). To connect to a real database:

1. Implement the `GDPRDatabase` interface from `src/services/gdpr-service.ts`
2. Replace `MockDatabase` with your implementation in `src/index.ts`

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, production)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:5173)

## License

Private
