module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@mobile': './src',
            '@pet/domain': '../web/src/core/domain',
            '@petspark/shared': '../../packages/shared/src'
          }
        }
      ]
    ]
  }
}
