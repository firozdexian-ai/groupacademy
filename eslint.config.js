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

// Phase 10j.5j2: ban raw supabase.auth.getUser / getSession outside the
// centralized auth boundary (`src/lib/auth.ts`) and the core auth-flow files
// that legitimately orchestrate sessions (useAuth, AuthGate, ProtectedRoute,
// Navbar identity badge, Auth pages, OnboardingWizard, ResetPassword).
const NO_RAW_AUTH = {
  selector:
    "CallExpression[callee.type='MemberExpression'][callee.object.type='MemberExpression'][callee.object.property.name='auth'][callee.object.object.name='supabase'][callee.property.name=/^(getUser|getSession)$/]",
  message:
    "Do not call supabase.auth.getUser/getSession directly. Use getCurrentUser / getCurrentSession / getAccessToken / getCurrentUserId from '@/lib/auth' (Phase 10j.5j convention).",
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
      "no-restricted-syntax": ["error", NO_RAW_INVOKE, NO_RAW_AUTH],
    },
  },
  {
    files: [
      "src/domains/*/api/*Api.ts",
      "src/components/ai-instructor/AIChatPanel.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", NO_RAW_AUTH],
    },
  },
  {
    // Core auth-flow files: legitimately orchestrate session/identity state.
    files: [
      "src/lib/auth.ts",
      "src/hooks/useAuth.ts",
      "src/components/AuthGate.tsx",
      "src/components/ProtectedRoute.tsx",
      "src/components/Navbar.tsx",
      "src/components/onboarding/OnboardingWizard.tsx",
      "src/pages/AuthClassic.tsx",
      "src/pages/AuthChat.tsx",
      "src/pages/ResetPassword.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", NO_RAW_INVOKE],
    },
  },
);
