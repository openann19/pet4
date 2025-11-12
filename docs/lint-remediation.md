# Web Lint Remediation Baseline (Nov 5, 2025)

Baseline commanded per Phase 1 of the Configuration Unification Mandate:

```bash
cd apps/web
pnpm lint --report-unused-disable-directives > ../../logs/web-lint-baseline.log 2>&1 || true
```

The run produced 1,058 errors and 65 warnings across the web workspace. The table below aggregates the violations by rule family.

| Category           | Violations | Representative Rules                                                                             | Notes                                                                                                  |
| ------------------ | ---------: | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Unsafe Types       |        434 | `@typescript-eslint/no-unsafe-assignment`, `no-unsafe-member-access`, `no-explicit-any`          | Generated data/services still rely on `any` payloads; map/analytics modules are especially high-noise. |
| Async Discipline   |        356 | `@typescript-eslint/no-floating-promises`, `require-await`, `await-thenable`                     | Promise chains ignore rejection handling; many async helpers do not await internal work.               |
| React Strictness   |        166 | `@typescript-eslint/no-misused-promises`, `no-unsafe-argument`                                   | Hook callbacks and event handlers pass raw promises/any-typed results.                                 |
| React Hooks        |         65 | `react-hooks/exhaustive-deps`                                                                    | Map quota monitors, particle FX, and optimization hooks have missing or extraneous deps.               |
| Design Consistency |         51 | `sonarjs/no-duplicate-string`                                                                    | Literal duplication across templates, notifications, and theme presets.                                |
| Unused & Redundant |         38 | `@typescript-eslint/no-unused-vars`, `unicorn/prefer-optional-catch-binding`                     | Logging/error handlers capture unused bindings.                                                        |
| Legacy Spark Usage |         13 | `no-restricted-syntax`                                                                           | `community-seed-data.ts` still calls `spark.kv.*`.                                                     |
| Error Handling     |          8 | `@typescript-eslint/prefer-promise-reject-errors`, `promise/catch-or-return`                     | Fetch pipelines reject with non-Error types or forget to return promises.                              |
| Uncategorized      |        163 | e.g., `@typescript-eslint/unbound-method`, `no-restricted-globals`, `react-hooks/rules-of-hooks` | Miscellaneous quality gates not yet grouped; require follow-up triage.                                 |

## Highest-Volume Rules

Top offenders span promise handling and unsafe type usage:

1. `@typescript-eslint/no-floating-promises` – 139
2. `@typescript-eslint/no-misused-promises` – 128
3. `@typescript-eslint/no-unsafe-assignment` – 127
4. `@typescript-eslint/no-unsafe-member-access` – 113
5. `@typescript-eslint/no-explicit-any` – 87
6. `@typescript-eslint/require-await` – 79
7. `@typescript-eslint/unbound-method` – 70
8. `react-hooks/exhaustive-deps` – 65
9. `sonarjs/no-duplicate-string` – 51
10. `@typescript-eslint/no-unsafe-argument` – 38

These align with the previously defined Phase 1 remediation pillars (strict typing, async hygiene, hook discipline, and tokenization).

## Disabled Directives Inventory

Only one lint suppression surfaced in the baseline:

- `apps/web/src/vite-env.d.ts:48` – unused `eslint-disable` for `no-var` (currently flagged by the baseline run). No `@ts-ignore` or `@ts-expect-error` markers were detected inside the web workspace during this scan.

## Next Steps

- Decompose the "Uncategorized" bucket by mapping the remaining rules (e.g., `@typescript-eslint/unbound-method`, `react-hooks/rules-of-hooks`, `no-restricted-globals`) to existing remediation tracks.
- Apply service-level fixes to eliminate `any` funnels and unhandled promises before re-running the lint suite with `--max-warnings 0`.
- Repeat the same baseline capture for mobile, shared packages, and type/test/security pipelines as mandated in WORKFLOW.
