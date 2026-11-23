// ESLint flat config: TypeScript (type-aware) everywhere; React, hooks and accessibility for the
// React adapter and the demo; Node globals for tests, scripts and root configs.
// Formatting belongs to Prettier (`npm run format:check`); eslint-config-prettier switches
// off every rule that would fight it.
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    'coverage/**',
    'tmp/**',
    'playwright-report/**',
    'test-results/**',
    'examples/**',
    '**/*.min.js',
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Explicit projects: each tsconfig is its own program, not a reference.
        project: [
          './tsconfig.json',
          './tsconfig.ember.json',
          './tsconfig.node.json',
          './tsconfig.test.json',
          './demo/tsconfig.json',
          './demo/tsconfig.node.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // The library runs in browsers.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },

  // React: the published adapter and the demo app.
  {
    files: ['src/react/**/*.{ts,tsx}', 'demo/src/**/*.{ts,tsx}'],
    extends: [
      eslintReact.configs['recommended-type-checked'],
      reactHooks.configs.flat.recommended,
      jsxA11y.configs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      // react-hooks/set-state-in-effect reports the same thing.
      '@eslint-react/set-state-in-effect': 'off',
      // onClick={async () => …} handlers are fine.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // The adapter supports React 18 (peerDependencies), which needs forwardRef for refs.
  {
    files: ['src/react/**/*.{ts,tsx}'],
    rules: { '@eslint-react/no-forward-ref': 'off' },
  },
  // Terminal-style "// comment" text is part of the demo's look.
  {
    files: ['demo/src/**/*.{ts,tsx}'],
    rules: { '@eslint-react/jsx-no-comment-textnodes': 'off' },
  },

  // Node: tests, scripts, bin helpers, configs.
  {
    files: [
      'tests/**/*.ts',
      'scripts/**/*.ts',
      'bin/**/*.{js,mjs}',
      '*.config.{js,ts}',
      'demo/vite.config.ts',
      'demo/vite/**/*.ts',
      'demo/scripts/**',
    ],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },

  // Plain JS files have no type information.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
]);
