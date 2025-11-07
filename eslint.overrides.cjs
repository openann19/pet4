module.exports = [
  {
    files: ['scripts/**/*.{ts,js,mjs,cjs}'],
    languageOptions: { globals: { process: 'readonly', __dirname: 'readonly', module: 'readonly' } },
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx,js}'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
];
