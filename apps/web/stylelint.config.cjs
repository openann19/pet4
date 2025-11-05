module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'no-empty-source': null,
    'color-hex-length': 'long',
    'selector-class-pattern': '^[a-z0-9\-]+$',
  },
  ignoreFiles: ['**/dist/**', '**/build/**', '**/.next/**', '**/node_modules/**'],
  reportNeedlessDisables: true,
  reportDescriptionlessDisables: true,
};

