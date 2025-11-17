# Production Readiness Checklist

This checklist ensures the PetSpark backend is ready for production deployment.

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] All environment variables configured in production environment
- [ ] `JWT_SECRET` is a strong, randomly generated secret (32+ characters)
- [ ] `DATABASE_URL` points to production PostgreSQL database
- [ ] `NODE_ENV=production` set in production
- [ ] `CORS_ORIGIN` includes only production frontend URLs
- [ ] AWS S3 credentials configured (if using file uploads)
- [ ] Stripe keys configured (if using payments)
- [ ] All secrets stored securely (not in code or version control)

### 2. Database

- [ ] Production database created and accessible
- [ ] Database migrations run (`pnpm db:migrate`)
- [ ] Database backups configured
- [ ] Connection pooling configured (if needed)
- [ ] Database indexes verified for performance
- [ ] Foreign key constraints verified

### 3. Security

- [ ] HTTPS enabled (TLS/SSL certificates configured)
- [ ] Helmet security headers enabled (✅ already configured)
- [ ] CORS properly configured for production origins
- [ ] Rate limiting enabled (✅ configured for auth endpoints)
- [ ] Input validation on all endpoints (✅ Zod schemas)
- [ ] SQL injection protection (✅ Prisma ORM)
- [ ] XSS protection (✅ Helmet)
- [ ] CSRF protection (if needed for web clients)
- [ ] Password hashing using Argon2 (✅ configured)
- [ ] JWT tokens with appropriate expiry times (✅ configured)
- [ ] Refresh token rotation implemented (✅ configured)

### 4. Error Handling

- [ ] Global error handler configured (✅ implemented)
- [ ] Error logging configured
- [ ] Sensitive error details hidden in production
- [ ] Proper HTTP status codes returned
- [ ] Error messages are user-friendly

### 5. Logging & Monitoring

- [ ] Structured logging configured (✅ logger utility)
- [ ] Log levels appropriate for production
- [ ] Error tracking service integrated (e.g., Sentry)
- [ ] Application performance monitoring (APM) configured
- [ ] Health check endpoints accessible (✅ `/healthz`, `/readyz`)
- [ ] Metrics collection configured

### 6. Performance

- [ ] Database queries optimized
- [ ] N+1 query issues resolved
- [ ] Response caching where appropriate
- [ ] File upload size limits configured (✅ 10MB limit)
- [ ] Request body size limits configured (✅ 10MB limit)
- [ ] Connection timeouts configured
- [ ] Load balancing configured (if needed)

### 7. Testing

- [ ] Unit tests written for critical functions
- [ ] Integration tests for API endpoints
- [ ] Authentication flow tested
- [ ] Payment flow tested (if using Stripe)
- [ ] File upload flow tested (if using S3)
- [ ] Error scenarios tested
- [ ] Load testing performed

### 8. Documentation

- [ ] API documentation complete (✅ API_ENDPOINTS.md)
- [ ] Setup instructions clear (✅ SETUP.md)
- [ ] Environment variables documented (✅ .env.example)
- [ ] Deployment guide written
- [ ] Runbook for common issues

### 9. Infrastructure

- [ ] Server/container configured
- [ ] Process manager configured (PM2, systemd, etc.)
- [ ] Auto-restart on failure configured
- [ ] Health checks configured for orchestration
- [ ] Resource limits configured (CPU, memory)
- [ ] Network security groups/firewall rules configured
- [ ] SSL/TLS termination configured

### 10. Dependencies

- [ ] All dependencies up to date
- [ ] Security vulnerabilities scanned and fixed
- [ ] Production dependencies only (no dev dependencies)
- [ ] Lock files committed (package-lock.json, pnpm-lock.yaml)

## 🚀 Deployment Steps

### 1. Build Application

```bash
cd apps/backend
pnpm install --production=false
pnpm build
```

### 2. Database Migration

```bash
# Run migrations
pnpm db:migrate

# Verify schema
pnpm db:studio  # Optional: verify in Prisma Studio
```

### 3. Start Application

```bash
# Production mode
NODE_ENV=production pnpm start

# Or with PM2
pm2 start dist/server.js --name petspark-api
```

### 4. Verify Deployment

```bash
# Health check
curl https://your-domain.com/healthz

# Readiness check
curl https://your-domain.com/readyz

# API version
curl https://your-domain.com/api/version
```

## 🔍 Post-Deployment Verification

- [ ] Health endpoints responding correctly
- [ ] Authentication endpoints working
- [ ] Database connections stable
- [ ] File uploads working (if configured)
- [ ] Payment processing working (if configured)
- [ ] Error logs monitored
- [ ] Performance metrics within acceptable ranges
- [ ] No critical errors in logs

## 📊 Monitoring & Alerts

Set up monitoring for:

- [ ] Server uptime
- [ ] Response times
- [ ] Error rates
- [ ] Database connection pool
- [ ] Memory usage
- [ ] CPU usage
- [ ] Disk space
- [ ] API endpoint availability
- [ ] External service health (S3, Stripe)

## 🔄 Maintenance

### Regular Tasks

- [ ] Review error logs weekly
- [ ] Monitor performance metrics
- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Database backup verification
- [ ] Capacity planning review

### Updates

- [ ] Test updates in staging first
- [ ] Run database migrations carefully
- [ ] Monitor after deployments
- [ ] Rollback plan ready

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible
   - Verify network/firewall rules

2. **JWT Token Errors**
   - Verify `JWT_SECRET` is set
   - Check token expiry times
   - Verify token format

3. **File Upload Errors**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Verify bucket exists

4. **Payment Errors**
   - Verify Stripe keys
   - Check webhook configuration
   - Verify Stripe account status

5. **CORS Errors**
   - Verify `CORS_ORIGIN` includes frontend URL
   - Check CORS middleware configuration

## 📝 Notes

- All endpoints require authentication unless specified
- Rate limiting is enabled on authentication endpoints
- File uploads require AWS S3 configuration
- Payments require Stripe configuration
- Admin endpoints require admin role

## 🔗 Related Documentation

- [Setup Guide](./SETUP.md) - Development setup
- [API Endpoints](./API_ENDPOINTS.md) - Complete API reference
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Feature completion

