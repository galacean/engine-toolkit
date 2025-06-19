module.exports = {
  parser: "@typescript-eslint/parser", // Eslint TypeScript Parser
  extends: [
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
    "plugin:storybook/recommended"
  ],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true
  }
};
