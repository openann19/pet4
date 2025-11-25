# PetSpark Enhanced Ignition Script

A comprehensive startup script that launches all PetSpark services with development-friendly bypasses.

## Features

- 🚀 **One-command startup** for all services
- 🔓 **Login bypass** for development
- ⚡ **Selective service startup** (web, mobile, backend)
- 🛡️ **Configurable quality checks** (typecheck, lint)
- 📊 **Service monitoring** and logging
- 🎯 **Environment configuration** management

## Quick Start

```bash
# Start everything with login bypass enabled
./ignition.sh

# Show all available options
./ignition.sh --help
```

## Usage Options

### Command Line Options
```bash
./ignition.sh [options]

Options:
  --help, -h          Show help message
  --no-bypass         Disable login bypass
  --skip-typecheck    Skip TypeScript type checking
  --skip-lint         Skip ESLint checking
  --web-only          Start only web services
  --mobile-only       Start only mobile services
  --backend-only      Start only backend services
```

### Environment Variables
```bash
export BYPASS_LOGIN=true|false        # Enable/disable login bypass (default: true)
export SKIP_TYPECHECK=true|false      # Skip typecheck (default: false)
export SKIP_LINT=true|false           # Skip linting (default: false)
export START_BACKEND=true|false       # Start backend services (default: true)
export START_WEB=true|false            # Start web app (default: true)
export START_MOBILE=true|false         # Start mobile app (default: true)
```

## Service URLs

When started, services are available at:

- **Web App**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Mobile Expo**: http://localhost:8081

## Login Bypass Features

When bypass is enabled (default), the following happens:

- ✅ Auto-login as admin user
- ✅ Authentication disabled
- ✅ Mock API enabled
- ✅ Development mode activated
- ✅ Pre-commit hooks bypassed

## Development Workflow

### 1. Start Everything
```bash
./ignition.sh
```

### 2. Start Only Web Services
```bash
./ignition.sh --web-only
```

### 3. Start with Full Quality Checks
```bash
./ignition.sh --no-bypass
```

### 4. Skip Quality Checks for Fast Development
```bash
./ignition.sh --skip-typecheck --skip-lint
```

## Service Management

### Stop All Services
```bash
pkill -f 'pnpm.*dev|pnpm.*start'
```

### View Logs
```bash
tail -f logs/web.log
tail -f logs/mobile.log
```

### Restart Services
```bash
./ignition.sh
```

## Pre-commit Hook Bypass

The pre-commit hooks can be bypassed in development mode:

```bash
export SKIP_PRECOMMIT=true
git commit -m "WIP commit"
```

Or automatically when using the ignition script with bypass enabled.

## Environment Files

The script automatically creates environment files:

### Web App (apps/web/.env.local)
```env
VITE_BYPASS_LOGIN=true
VITE_AUTO_LOGIN_USER=admin
VITE_DEV_MODE=true
VITE_SKIP_AUTH=true
VITE_MOCK_API=true
```

### Mobile App (apps/mobile/.env)
```env
EXPO_PUBLIC_BYPASS_LOGIN=true
EXPO_PUBLIC_AUTO_LOGIN_USER=admin
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_SKIP_AUTH=true
EXPO_PUBLIC_MOCK_API=true
```

## Troubleshooting

### Port Conflicts
The script automatically clears ports 5173, 3000, 8081, and 19002.

### Dependency Issues
If dependencies are missing, the script runs `pnpm install` automatically.

### TypeCheck/Lint Errors
When bypass is enabled, typecheck and lint errors don't block startup but are reported.

### Service Not Starting
Check the log files in the `logs/` directory:
```bash
ls -la logs/
cat logs/web.log
cat logs/mobile.log
```

## Production Mode

For production deployment without bypasses:
```bash
./ignition.sh --no-bypass --skip-typecheck --skip-lint
```

Or set environment variables:
```bash
export BYPASS_LOGIN=false
export SKIP_TYPECHECK=false
export SKIP_LINT=false
./ignition.sh
```
