import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
})

export default defineConfig([
  js.configs.recommended,

  ...vue.configs['flat/essential'],

  ...fixupConfigRules(
    compat.extends(
      'plugin:@typescript-eslint/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript'
    )
  ),

  {
    files: ['**/*.{ts,tsx,js,jsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      // Manual registration is required only for plugins not covered by spreads above
      '@typescript-eslint': fixupPluginRules(typescriptEslint as any)
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '_' }],
      'import/named': 'off',
      'import/no-unresolved': 'off',
      'vue/multi-word-component-names': 'off',
      'prettier/prettier': 'warn',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off'
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json']
        }
      }
    }
  },

  skipFormatting,
  globalIgnores([
    '**/tests/',
    '**/__tests__/',
    'src/components/icons/cryptos/*.vue',
    'dist/**',
    'node_modules/**'
  ])
])
