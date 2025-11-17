/**
 * Lighthouse CI Configuration
 *
 * Performance budgets for web app
 * Fails CI if budgets are exceeded
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'pnpm --filter spark-template dev',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:5173',
      ],
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1200 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 2000 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500 KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100 KB
        'resource-summary:image:size': ['error', { maxNumericValue: 1000000 }], // 1 MB
        'resource-summary:font:size': ['error', { maxNumericValue: 200000 }], // 200 KB

        // Network requests
        'network-requests': ['error', { maxNumericValue: 50 }],
        'dom-size': ['error', { maxNumericValue: 1500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
