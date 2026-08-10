import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import vue from 'eslint-plugin-vue'
import security from 'eslint-plugin-security'
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

  security.configs.recommended,

  ...fixupConfigRules(compat.extends('plugin:@typescript-eslint/recommended')),

  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
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
      // This syntax-only rule reports every dynamic lookup in Vuex stores and metadata maps.
      // It cannot distinguish validated keys from attacker-controlled object properties.
      'security/detect-object-injection': 'off',
      'vue/multi-word-component-names': 'off',
      // `v-html` assigns to innerHTML, which makes the sink itself able to create any
      // element and any event handler. Render HTML through `components/common/SafeHtml`
      // instead: it rebuilds the tree from an explicit allowlist.
      'vue/no-v-html': 'error',
      'prettier/prettier': 'warn',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off'
    },
    settings: {
      'import-x/resolver-next': [
        createNodeResolver({ extensions: ['.js', '.mjs', '.cjs', '.json'] }),
        createTypeScriptImportResolver({
          project: ['./tsconfig.json']
        })
      ]
    }
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    }
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue']
      }
    }
  },

  {
    files: ['**/*.{spec,test}.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Contract tests intentionally resolve fixtures and source files assembled from the
      // repository root; none of these paths comes from an application user.
      'security/detect-non-literal-fs-filename': 'off'
    }
  },

  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      // TypeScript validates named imports itself. Keep the ESLint rule active for JavaScript,
      // where the compiler does not provide the same coverage.
      'import-x/named': 'error'
    }
  },

  {
    files: ['scripts/electron/sandboxFix.mjs'],
    rules: {
      // electron-builder supplies both paths during the trusted local packaging step.
      'security/detect-non-literal-fs-filename': 'off'
    }
  },

  {
    files: ['playwright.config.ts'],
    rules: {
      // Report paths and the long-running marker are local configuration values, not user input.
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off'
    }
  },

  skipFormatting,
  globalIgnores([
    '**/tests/',
    '**/__tests__/',
    'src/types/wallets/**',
    'src/components/icons/cryptos/*.vue',
    'dist/**',
    'node_modules/**'
  ])
])
