module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
  overrides: [
    {
      files: [
        "**/*.test.js",
        "**/*.test.ts"
      ],
      env: {
        jest: true
      }
    }
  ]
};
