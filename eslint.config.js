import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Phase 9h: ban raw supabase.functions.invoke outside owner-domain wrappers.
// Allowed: src/domains/*/api/*Api.ts (the wrappers themselves) and the
// AIChatPanel SSE streaming component which cannot use the standard wrapper.
const NO_RAW_INVOKE = {
  selector:
    "CallExpression[callee.type='MemberExpression'][callee.property.name='invoke'][callee.object.type='MemberExpression'][callee.object.property.name='functions']",
  message:
    "Do not call supabase.functions.invoke directly. Import a typed wrapper from src/domains/<owner>/api/<owner>Api.ts (Phase 9h convention).",
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": ["error", NO_RAW_INVOKE],
    },
  },
  {
    files: [
      "src/domains/*/api/*Api.ts",
      "src/components/ai-instructor/AIChatPanel.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
