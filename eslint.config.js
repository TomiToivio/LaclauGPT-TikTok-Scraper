import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'Node/node_modules/**',
      'coverage/**',
      'web-ext-artifacts/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['Node/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['Firefox/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        browser: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
