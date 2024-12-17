const commonRules = require("../.eslintrc-common.js").rules;

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/eslint-recommended", "prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    project: ["./tsconfig.test.json"],
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["dist/", "node_modules/", "build/", "public/", "src/migration/", ".eslintrc.js"],
  rules: {
    ...commonRules,
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
  },
};
