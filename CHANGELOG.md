# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Animation System Parity**: Comprehensive mobile parity implementation for web animation hooks
  - Shared TypeScript interfaces in `@pet3/motion` package for consistent API contracts
  - Ported web transition presets to shared module with reduced-motion support
  - Cross-platform haptic feedback system with Expo Haptics availability checks
  - Mobile implementations for core animation hooks:
    - `useGradientAnimation` - Pure animation logic, fully portable
    - `useIconRotation` - Pure animation logic, fully portable
    - `useMagneticEffect` - Touch-based magnetic interactions with haptic feedback
  - Mobile parity check script (`scripts/check_mobile_parity.sh`) integrated into CI

### Changed
- **Animation Architecture**: Unified animation system across web and mobile platforms
  - Standardized spring/timing configurations with validated ranges
  - Platform-agnostic transition presets (fadeIn, slideUp, scaleIn, etc.)
  - Enhanced type safety with shared interfaces for all animation hooks

### Technical Details
- **Shared Types**: New `packages/motion/src/types.ts` with comprehensive animation interfaces
- **Transition Presets**: `packages/motion/src/shared-transitions.ts` with cross-platform configurations
- **Haptic System**: `packages/motion/src/haptic.ts` with safe Expo Haptics integration
- **CI Integration**: Automated parity checking prevents new web-only animation hooks

### Migration Notes
- Existing animation hooks maintain backward compatibility
- New mobile implementations use PanGestureHandler for touch interactions
- Haptic feedback automatically disabled on unsupported platforms
- Reduced motion preferences respected across all implementations

### Next Steps
- Implement remaining 43 mobile animation hooks
- Add comprehensive RTL test coverage for mobile
- Create Expo Stories for visual regression testing
- Performance benchmarking on iOS/Android devices
