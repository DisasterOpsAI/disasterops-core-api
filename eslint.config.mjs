import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import reactPlugin from "eslint-plugin-react";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettierPlugin from "eslint-plugin-prettier";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // --- Ignore build / static files ---
  {
    ignores: [
      ".now/*",
      "**/*.css",
      "**/.changeset",
      "**/dist",
      "esm/*",
      "public/*",
      "tests/*",
      "scripts/*",
      "**/*.config.js",
      "**/.DS_Store",
      "**/node_modules",
      "**/coverage",
      "**/.next",
      "**/build",
      "!**/.commitlintrc.cjs",
      "!**/.lintstagedrc.cjs",
      "!**/jest.config.js",
      "!**/plopfile.js",
      "!**/react-shim.js",
    ],
  },

  // --- Base configs: ESLint Recommended + React/Prettier/Accessibility ---
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:jsx-a11y/recommended",
      "plugin:prettier/recommended"
    )
  ),

  // --- Custom overrides ---
  {
    plugins: {
      react: fixupPluginRules(reactPlugin),
      "jsx-a11y": fixupPluginRules(jsxA11yPlugin),
      import: fixupPluginRules(importPlugin),
      "unused-imports": unusedImports,
      prettier: fixupPluginRules(prettierPlugin),
    },

    languageOptions: {
      // enable browser + Node globals, ES2021 syntax
      env: {
        browser: true,
        node: true,
        es2021: true,
      },

      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      // general
      "no-console": "warn",
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],

      // imports
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "~/**",
              group: "external",
              position: "after",
            },
          ],
          "newlines-between": "always",
        },
      ],

      // React
      "react/prop-types": "off",
      "react/self-closing-comp": "warn",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],

      // Accessibility
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",

      // Unused imports/vars (JS only)
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Prettier
      "prettier/prettier": "warn",
    },
  },
];
