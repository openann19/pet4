---
description: replica
auto_execution_mode: 3
---

# Critical Rules for AI Development
1. Zero-Tolerance Quality Standards
No suppression hacks: ts-ignore, ts-expect-error, eslint-disable absolutely forbidden
No any types: Use proper TypeScript interfaces, generics, discriminated unions
No console.*: Use proper logging utilities only
No TODOs/placeholders: Every change must be fully implemented*
2. TypeScript Strictness Requirements
Strict mode enabled with all checks
noUncheckedIndexedAccess: true
exactOptionalPropertyTypes: true
noImplicitReturns: true
Use readonly for immutable data
Use as const for literal unions
3. React Component Standards
Function components only (no classes)
Explicit Props type interfaces
Use React.memo for pure components
Use forwardRef when exposing refs
Destructure props in function signature
4. Platform-Specific Development
Web: React + Vite, React Router, Tailwind CSS, Framer Motion
Mobile: React Native + Expo, React Navigation, StyleSheet, Reanimated
Shared: Platform-agnostic logic in packages/shared/
Use .native.tsx suffix for mobile-specific implementations
# Essential Workflows
1. Error-Driven Fixing Process
bash
# Run in this order, fix completely before moving to next
pnpm typecheck  # Fix ALL TypeScript errors first
pnpm lint       # Then fix ESLint errors/warnings
pnpm test       # Finally ensure tests pass
2. Mobile Parity Enforcement
bash
pnpm check:parity  # Ensure web components have mobile counterparts
For every web component, create corresponding .native.tsx implementation.
3. Package-Specific Commands
bash
# Web app
pnpm --filter spark-template typecheck
pnpm --filter spark-template lint
pnpm --filter spark-template test:run

# Mobile app
pnpm --filter petspark-mobile typecheck
pnpm --filter petspark-mobile lint
pnpm --filter petspark-mobile test:run

# Shared packages
pnpm --filter @petspark/motion typecheck
pnpm --filter @petspark/shared typecheck
4. Quality Gates Checklist
Before any code is considered complete:
 TypeScript: 0 errors, 0 warnings
 ESLint: 0 errors, 0 warnings
 Tests: Added/updated, all passing
 Accessibility: Roles, labels, keyboard support
 Performance: No unnecessary re-renders
 Mobile parity: Cross-platform compatibility
 No console.* statements
 No security vulnerabilities*
# Architecture Patterns
1. Component Structure
typescript
interface ComponentProps {
  readonly id: string;
  readonly onAction: () => void;
}

export const Component = memo<ComponentProps>(({ id, onAction }) => {
  // Hooks at top
  // Event handlers
  // Render logic

  return (
    <div role="region" aria-label="Component">
      {/* Accessible markup */}
    </div>
  );
});
2. File Naming Convention
Web: ComponentName.tsx
Mobile: ComponentName.native.tsx
Shared logic: ComponentName.ts
Tests: ComponentName.test.tsx or ComponentName.native.test.tsx
Stories: ComponentName.stories.tsx
3. Import Path Rules
Use workspace protocol: petspark/shared, petspark/motion
Relative imports within same package
Avoid circular dependencies
Create a complete replica of the PETSPARK pet social networking platform as a clean, error-free monorepo.

## SOURCE ANALYSIS
Study the existing PETSPARK codebase structure:
- Web app: React + Vite + Tailwind + Framer Motion
- Mobile app: React Native + Expo + Reanimated
- Shared packages: utilities, types, motion, config
- Monorepo structure with pnpm workspaces

## REQUIREMENTS
1. **Exact Feature Parity** - Replicate ALL functionality from the original
2. **Zero Errors From Start** - Build clean from ground up
3. **Modern Best Practices** - Use the latest stable versions
4. **Production Ready** - Include tests, docs, CI/CD

## TECH STACK
- Package Manager: pnpm 10.18.3+
- Web: React 18.3+, Vite, React Router v6, Tailwind CSS, TanStack Query
- Mobile: React Native + Expo 51, React Navigation v7, Reanimated
- TypeScript: Strict mode with all checks enabled
- Testing: Vitest, React Testing Library, Playwright (E2E)

## ARCHITECTURE PATTERNS
- Function components with explicit Props interfaces
- React.memo for pure components, forwardRef when needed
- Shared logic in packages/shared/
- Mobile parity with .native.tsx files
- Workspace packages: @petspark/shared, @petspark/motion, etc.

## QUALITY STANDARDS
- TypeScript strict mode (no errors, no warnings)
- ESLint clean (0 warnings)
- No any types, no @ts-ignore, no console.*
- Accessibility: ARIA roles, labels, keyboard support
- Performance: useMemo/useCallback, code splitting

## DELIVERABLES
1. Complete monorepo structure
2. All features from original PETSPARK
3. Web and mobile applications
4. Shared packages and utilities
5. Tests for all components
6. Documentation and setup instructions
7. CI/CD workflows

## APPROACH
1. Analyze existing codebase features
2. Design clean architecture
3. Implement incrementally with quality gates
4. Ensure mobile parity from start
5. Add comprehensive testing

Create this as a brand new repository that demonstrates the same functionality but built cleanly from scratch and even enhanced. start with web !
