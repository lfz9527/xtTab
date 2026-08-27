import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import autoImports from './.wxt/eslint-auto-imports.mjs'

export default [
  autoImports,
  { files: ['**/*.{ts,tsx,js,jsx}'] },
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      quotes: ['warn', 'single', { avoidEscape: true }]
      // 原 endOfLine 规则名不存在于 ESLint 核心规则，已移除；LF 换行由 Prettier 默认与 .editorconfig 共同保证
    }
  },
  // 忽略文件
  {
    ignores: [
      'dist',
      '.vscode',
      '.idea',
      '*.sh',
      '**/node_modules',
      '*.md',
      '*.woff',
      '*.woff',
      '*.ttf',
      'yarn.lock',
      'package-lock.json',
      'pnpm-lock.yaml',
      '/public',
      '/docs',
      '**/output',
      '.husky',
      '.local',
      '/bin',
      'Dockerfile',
      '**/.output',
      '**/.wxt'
    ]
  }
]
