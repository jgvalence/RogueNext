import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.{ts,tsx,js,mjs}"],
    // Command-line reports intentionally write their results to standard output.
    rules: { "no-console": "off" },
  },
  {
    files: ["scripts/**/*.{ts,tsx,js,mjs}"],
    // Command-line reports intentionally write their results to standard output.
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
