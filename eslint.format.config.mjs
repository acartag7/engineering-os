export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.mjs"],
    rules: {
      "array-bracket-spacing": ["error", "never"],
      "comma-dangle": ["error", "always-multiline"],
      "indent": ["error", 2],
      "keyword-spacing": "error",
      "object-curly-spacing": ["error", "always"],
      "semi": ["error", "always"],
      "space-before-blocks": "error",
    },
  },
];
