import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "coverage/**", "migrations/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.js", "server.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      "no-undef": "off",
      "no-console": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "smart"],
      "no-throw-literal": "warn",
      "prefer-promise-reject-errors": "warn",
      "no-return-await": "warn",
      "require-atomic-updates": "warn",
      "no-useless-escape": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
];
