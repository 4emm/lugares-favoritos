const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettier = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "web-build/**",
      "coverage/**",
      "android/**",
      "ios/**",
    ],
  },
  {
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      complexity: ["error", 10],
      "max-depth": ["error", 3],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAnyKeyword",
          message: "Evita any; conserva el tipado estricto.",
        },
      ],
    },
  },
  {
    files: ["src/components/Radar.tsx"],
    rules: {
      // Reanimated shared values are intentionally mutated inside worklet callbacks.
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx", "ia/**/*.mjs", "jest.config.js"],
    rules: {
      "max-lines": "off",
    },
  },
]);
