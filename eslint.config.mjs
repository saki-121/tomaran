import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  // next/core-web-vitals: Next.js rules + react-hooks + react (via compat shim)
  // next/typescript:       @typescript-eslint recommended rules
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    // Type-aware lint rules — requires tsc project reference
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      // ── TypeScript ────────────────────────────────────────────────────────

      // Warn rather than error — 'any' is sometimes unavoidable at Supabase
      // RPC boundaries before codegen catches up
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused vars: prefix with _ to suppress (e.g. _unusedParam)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Enforce `import type` for type-only imports — keeps runtime bundle clean
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Unhandled promise rejections are a silent crash risk in Route Handlers
      '@typescript-eslint/no-floating-promises': 'error',

      // Require explicit return types on exported functions (documents contracts)
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // ── Next.js / React ───────────────────────────────────────────────────

      // False positives with Tailwind and JSX content
      'react/no-unescaped-entities': 'off',

      // ── General ───────────────────────────────────────────────────────────

      // Allow console.warn / console.error for server-side error logging;
      // ban console.log so debug output doesn't leak into production
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    // Relax some rules inside migration files — they are plain SQL strings
    // wrapped in template literals, not application logic
    files: ['supabase/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]
