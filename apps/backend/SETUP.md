# Backend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/backend
pnpm install
```

### 2. Set Up Database

#### Option A: Using Docker (Recommended for Development)

```bash
# Start PostgreSQL in Docker
docker run --name petspark-db \
  -e POSTGRES_USER=petspark \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=petspark \
  -p 5432:5432 \
  -d postgres:14

# Wait a few seconds for database to start, then:
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
```

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create database:
   ```sql
   CREATE DATABASE petspark;
   ```
3. Update `.env` with your connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/petspark?schema=public"
   ```
4. Generate Prisma client and push schema:
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

### 3. Configure Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and fill in your values. See `.env.example` for all available configuration options.

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

**Optional but recommended:**
- `AWS_*` - For file uploads (S3)
- `STRIPE_*` - For payment processing
- `CORS_ORIGIN` - Allowed frontend origins

**⚠️ Security Note**: Generate a secure JWT secret:
```bash
# Generate a random 32+ character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## ✅ Verify Installation

### Test Health Endpoints

```bash
# Health check
curl http://localhost:3000/healthz

# Readiness check (requires database)
curl http://localhost:3000/readyz

# Version info
curl http://localhost:3000/api/version
```

### Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (use accessToken from login response)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── server.ts              # Main server entry
│   ├── routes/                # API routes
│   │   ├── health.ts         # Health check routes
│   │   ├── api.ts            # Main API router
│   │   └── auth.ts          # Authentication routes
│   ├── controllers/          # Route controllers
│   │   ├── health.ts
│   │   └── auth.ts
│   ├── middleware/           # Express middleware
│   │   ├── error-handler.ts
│   │   ├── request-logger.ts
│   │   └── auth.ts          # JWT authentication
│   └── utils/               # Utility functions
│       ├── jwt.ts          # JWT token utilities
│       └── password.ts     # Password hashing
├── prisma/
│   └── schema.prisma        # Database schema
└── package.json
```

## 🔧 Available Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push         # Push schema (development)
pnpm db:migrate      # Run migrations (production)
pnpm db:studio       # Open Prisma Studio GUI

# Build
pnpm build           # Compile TypeScript
pnpm start           # Run production server

# Code Quality
pnpm typecheck       # Type check without building
pnpm lint            # Run ESLint
```

## 🐛 Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   # Docker
   docker ps | grep postgres
   
   # Local
   psql -U postgres -c "SELECT version();"
   ```

2. **Verify DATABASE_URL** in `.env` matches your setup

3. **Check database exists**:
   ```bash
   psql -U postgres -l | grep petspark
   ```

### Port Already in Use

If port 3000 is already in use:
```bash
# Change PORT in .env
PORT=3001
```

### Prisma Client Not Generated

```bash
pnpm db:generate
```

### JWT Secret Error

Make sure `JWT_SECRET` in `.env` is at least 32 characters long.

## 📚 Implementation Status

✅ **All Core Features Complete!**

1. ✅ Core infrastructure - **COMPLETE**
2. ✅ Health check endpoints - **COMPLETE**
3. ✅ Authentication endpoints - **COMPLETE**
4. ✅ User management endpoints - **COMPLETE**
5. ✅ Pet CRUD operations - **COMPLETE**
6. ✅ Matching algorithm - **COMPLETE**
7. ✅ Chat & messaging - **COMPLETE**
8. ✅ File uploads (S3) - **COMPLETE**
9. ✅ Payments (Stripe) - **COMPLETE**
10. ✅ Admin dashboard - **COMPLETE**
11. ✅ All other features - **COMPLETE**

**Total: 120+ API endpoints implemented**

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for complete details.

## 🔗 Related Documentation

- [Backend Analysis](../../BACKEND_ANALYSIS.md) - Complete backend requirements
- [README](./README.md) - Backend documentation
- [API Documentation](./docs/api.md) - API endpoint docs (coming soon)

