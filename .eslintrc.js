module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  plugins: ['prettier'],
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'prettier/prettier': ['error', { singleQuote: true, printWidth: 99 }],
  },
};
