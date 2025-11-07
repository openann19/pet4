module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // Prevent console.* usage in production code
    'no-console': 'error',
  },
};
