import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      // 🏛️ [ADR-005] Raw console.* bypasses src/utils/logger.ts's production
      // suppression + Sentry redirection. This repo's lint script runs with
      // --max-warnings 0 (unlike the main frontend's), so 'warn' would fail
      // every existing `npm run lint` run immediately — 'error' + an explicit
      // grandfather override (below) for today's ~30 pre-existing violating
      // files is the equivalent non-blocking rollout here. New files are
      // enforced immediately; grandfathered files should have entries removed
      // as they're migrated to `logger`, not added to.
      'no-console': 'error',
    },
  },
  {
    // 🏛️ [ADR-005] no-console grandfather list — pre-existing violations as of
    // the rule's introduction. Remove a file's entry once it's migrated to
    // `logger`; do not add new files here.
    files: [
      'src/api/axios.ts',
      'src/api/socket.ts',
      'src/components/CourtCaseDetailsModal.tsx',
      'src/components/ErrorBoundary.tsx',
      'src/components/Header.tsx',
      'src/components/ResilientSocketWatcher.tsx',
      'src/pages/AdsModeration.tsx',
      'src/pages/AppLedLogistics.tsx',
      'src/pages/AuditLogs.tsx',
      'src/pages/Complaints.tsx',
      'src/pages/CourtCases.tsx',
      'src/pages/Governance.tsx',
      'src/pages/Marketing.tsx',
      'src/pages/Orders.tsx',
      'src/pages/PlatformFeedback.tsx',
      'src/pages/PlatformReviews.tsx',
      'src/pages/ProductDetails.tsx',
      'src/pages/ProductModeration.tsx',
      'src/pages/Products.tsx',
      'src/pages/Reviews.tsx',
      'src/pages/RiskManagement.tsx',
      'src/pages/SecurityDashboard.tsx',
      'src/pages/SettingsPage.tsx',
      'src/pages/SettlementManagement.tsx',
      'src/pages/SupportInquiries.tsx',
      'src/pages/UserDetails.tsx',
      'src/pages/VendorDetails.tsx',
      'src/store/authStore.ts',
      'src/utils/security.ts',
    ],
    rules: { 'no-console': 'off' },
  },
  {
    // logger.ts's own internal console calls are the intended, gated
    // implementation, not a violation — permanent exemption, not a grandfather entry.
    files: ['src/utils/logger.ts'],
    rules: { 'no-console': 'off' },
  },
)
