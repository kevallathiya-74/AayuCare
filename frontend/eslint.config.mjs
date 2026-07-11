import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactNativePlugin from "eslint-plugin-react-native";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "web-build/**",
      "coverage/**",
    ],

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
    },

    languageOptions: {
      globals: {
        __DEV__: "readonly",
        console: "readonly",
        window: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        require: "readonly",
        module: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        global: "readonly",
        __dirname: "readonly",
        AbortController: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        URL: "readonly",
        beforeAll: "readonly",
      },
    },

    settings: {
      react: { version: "19.0" },
    },

    rules: {
      // React
      "react/jsx-no-target-blank": "warn",
      "react/no-unknown-property": "error",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn",
      "react-native/no-raw-text": ["warn", { skip: ["Text"] }],
      "react-native/no-single-element-style-arrays": "warn",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "error",
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["warn", "smart"],
      "no-throw-literal": "warn",
      "prefer-promise-reject-errors": "warn",
      "no-return-await": "warn",
      "require-atomic-updates": "warn",
    },
  },

  // Config files are CommonJS
  {
    files: ["*.config.js", "metro.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
];
