import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    ignores: [
      "dist/",
      "build/",
      "node_modules/",
      "coverage/",
      "eslint.config.mjs",
      "jest.config.js",
    ],
  },
);
