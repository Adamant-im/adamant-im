import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import vue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import parser from 'vue-eslint-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
})
const config = defineConfig([
  {
    extends: fixupConfigRules(
      compat.extends(
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        '@vue/eslint-config-prettier/skip-formatting',
        'plugin:import/recommended',
        'plugin:import/typescript'
      )
    ),
    ignores: ['tests/', 'tests__/'],
    languageOptions: {
      ecmaVersion: 13,
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: parser,
      parserOptions: {
        parser: {
          '<template>': 'espree',
          js: 'espree',
          ts: '@typescript-eslint/parser'
        }
      }
    },
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      vue: fixupPluginRules(vue)
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '_' }],
      'import/named': 'off',
      'import/no-unresolved': 'error',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'vue/multi-word-component-names': 'off'
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true
      }
    }
  },
  globalIgnores(['**/tests/', '**/__tests__/', 'src/components/icons/cryptos/*.vue'])
])

export default config
