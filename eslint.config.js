import { defineConfig, globalIgnores } from "eslint/config";

import globals from "globals";

import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";

import parser from "vue-eslint-parser";
import vue from "eslint-plugin-vue";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
require("@rushstack/eslint-patch/modern-module-resolution");

const config = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: parser,
        ecmaVersion: 13,

        parserOptions: {
            parser: {
                js: "espree",
                ts: "@typescript-eslint/parser",
                "<template>": "espree",
            },
        },
    },

    extends: fixupConfigRules(compat.extends(
        "plugin:vue/vue3-essential",
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "@vue/eslint-config-prettier/skip-formatting",
        "plugin:import/recommended",
        "plugin:import/typescript",
    )),

    plugins: {
        vue: fixupPluginRules(vue),
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "_",
        }],

        "vue/multi-word-component-names": "off",
        "import/no-unresolved": "error",
        "import/named": "off",
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
    },

    settings: {
        "import/resolver": {
            typescript: true,
            node: true,
        },
    },
}, globalIgnores(["src/components/icons/cryptos/*.vue"]), globalIgnores(["**/tests/", "**/__tests__/"])]);

export default config;
