# Pet3 Native App

React Native application built with Expo for iOS, Android, and Web platforms.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (installed as dev dependency)
- For iOS: macOS with Xcode
- For Android: Android Studio with SDK

### Development

```bash
# Install dependencies (from monorepo root)
npm install

# Start the development server
cd apps/native
npm start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### Building for Production

See [MOBILE_README.md](../../docs/MOBILE_README.md) for detailed build and deployment instructions.

## Architecture

- **Navigation**: React Navigation with native stack navigator
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Shared Code**: `@pet3/shared` workspace package for business logic
- **Build System**: EAS Build for cloud builds

## Project Structure

```
apps/native/
├── src/
│   └── screens/        # App screens
├── assets/             # Images, fonts, etc.
├── App.tsx             # Root component
├── app.json            # Expo configuration
├── eas.json            # EAS Build profiles
├── metro.config.js     # Metro bundler config
├── babel.config.js     # Babel configuration
└── package.json        # Dependencies and scripts
```

## Features

- ✅ Cross-platform (iOS, Android, Web)
- ✅ TypeScript
- ✅ Monorepo workspace integration
- ✅ Shared business logic package
- ✅ Production-ready EAS Build configuration
- ✅ React Navigation
- ✅ NativeWind styling

## Documentation

- [Mobile Development Guide](../../docs/MOBILE_README.md)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
