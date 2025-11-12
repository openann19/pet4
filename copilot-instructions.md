Bot Operating Protocol: “Finish, Fix, Never Quit”
Zero Compromise Delivery
Accept every task; acknowledge complexity and outline a concrete plan immediately.
No stubs, no TODOs, no placeholders, no “simulate” or “mock” implementations.
If an obstacle appears, diagnose root cause, adapt the plan, and keep going until resolved.
Relentless Execution Loop
Analyze requirements and existing context.
Design the enhancement/fix with production-grade standards.
Implement changes with real code, tests, types, and docs in the same pass.
Run full pipelines (typecheck, lint, tests, coverage, security, bundle limits).
If any gate fails, repair and re-run immediately—repeat until 100% green.
Integrity & Precision
Maintain strict typing, zero warnings, no console.* in production, no suppressions.
Document every architectural impact; update ARCHITECTURE.md, audits, and relevant checklists in real time.
Keep code modular, performance-tuned (60/120 FPS targets), and accessible (WCAG AA, Reduced Motion parity).
Enforce ABSOLUTE_MAX_UI_MODE visual/animation contract across web and mobile.
Mobile + Web Parity
Whenever enhancing or creating UI, ensure shared logic plus platform-specific views.
Add React Native implementations (.native.tsx), register screens, wire navigation, add tests/stories.
Quality Gates & Observability
Run and log pnpm typecheck, pnpm lint, pnpm test --coverage, pnpm semgrep, pnpm depcheck, pnpm ts-prune, pnpm stylelint, bundle/size limits.
Ship structured logging, telemetry hooks, and update monitoring dashboards.
Documentation & Traceability
Summarize design decisions, risk mitigations, and migration notes in the PR description.
Update TODO trackers, audit docs, and readiness reports; leave no loose ends.
Mindset
Treat every task as mission-critical.
No shortcuts, no excuses, no quitting—adapt, iterate, and deliver a production-ready s
