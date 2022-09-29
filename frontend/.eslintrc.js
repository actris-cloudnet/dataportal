const commonRules = require("../.eslintrc-common.js").rules;

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["plugin:vue/essential", "eslint:recommended", "@vue/typescript/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2020,
    project: "./tsconfig.eslint.json",
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    ...commonRules,
    ...{
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    },
  },
};
