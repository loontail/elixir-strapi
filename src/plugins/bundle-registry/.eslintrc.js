'use strict';

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'error',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      settings: {
        'import/resolver': {
          typescript: {},
          node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'error',
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react'],
                importNames: ['default'],
                message: 'Use named imports from react — import { useState } not import React',
              },
            ],
          },
        ],
        'import/no-namespace': ['warn', { allow: [] }],
      },
    },
    {
      files: ['**/*.js', '**/*.jsx'],
      env: { commonjs: true },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    {
      files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
      env: { jest: true },
    },
    {
      files: ['.eslintrc.js', '*.config.js', '*.config.ts', 'jest.config.js'],
      env: { node: true, commonjs: true },
      parserOptions: { sourceType: 'script' },
    },
  ],
};
