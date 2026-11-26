import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * FSD 계층. 앞쪽이 높은 계층이다.
 * 높은 계층은 낮은 계층을 import 할 수 있지만 그 반대는 안 된다.
 */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

/** 슬라이스로 나뉘는 계층. 같은 계층의 다른 슬라이스를 import 할 수 없다. */
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities'];

/** 계층마다 금지할 import 패턴을 만든다. */
function fsdLayerConfig(layer) {
  const index = LAYERS.indexOf(layer);
  const upperLayers = LAYERS.slice(0, index);
  const patterns = [];

  if (upperLayers.length > 0) {
    patterns.push({
      regex: `^@/(${upperLayers.join('|')})(/|$)`,
      message: `FSD: ${layer} 계층은 상위 계층(${upperLayers.join(', ')})을 import 할 수 없습니다.`,
    });
  }

  if (SLICED_LAYERS.includes(layer)) {
    patterns.push({
      regex: `^@/${layer}(/|$)`,
      message: `FSD: 같은 계층(${layer})의 슬라이스끼리는 import 할 수 없습니다. 슬라이스 안에서는 상대 경로를 쓰세요.`,
    });
  }

  patterns.push({
    regex: `^@/(${SLICED_LAYERS.join('|')})/[^/]+/.+`,
    message: 'FSD: 슬라이스는 public API(index.ts)로만 가져다 씁니다. 예) @/entities/user',
  });

  return {
    name: `fsd/${layer}`,
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': ['error', { patterns }],
    },
  };
}

export default defineConfig(
  globalIgnores(['dist/**', 'coverage/**', '**/*.d.ts']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  ...LAYERS.map(fsdLayerConfig),
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts', 'src/shared/lib/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.config.{ts,mjs,js}', '.claude/hooks/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  // prettier 와 충돌하는 포맷 규칙 비활성화 — 항상 마지막에 둔다.
  prettier,
);
