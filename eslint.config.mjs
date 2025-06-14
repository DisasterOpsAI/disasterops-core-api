import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";

// resolve __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...compat.extends("airbnb-base", "eslint-config-prettier"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettier.rules,
      "prettier/prettier": "error",
    },
  },
];
