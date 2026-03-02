import type { NextConfig } from 'next'

// =============================================================================
// Environment validation
// Checked at build time and server start — fails loudly rather than producing
// a runtime crash deep inside a request handler.
//
// Only NEXT_PUBLIC_* vars are validated here: they must be present at build
// time so Next.js can embed them in the browser bundle. Server-only secrets
// (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET) are validated at the call
// site in src/lib/supabase/server.ts via the non-null assertion.
// =============================================================================

const requiredPublicEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

for (const key of requiredPublicEnv) {
  if (!process.env[key]) {
    throw new Error(
      `\n[next.config.ts] Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env.local and fill in the values.\n`,
    )
  }
}

const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
const isDev = process.env.NODE_ENV === 'development'

// =============================================================================
// Content Security Policy
// Inline styles are required by Next.js (style injection during hydration).
// unsafe-eval is restricted to development only (react-refresh / Turbopack).
// Nonce-based CSP is the ideal end-state; this is a solid pragmatic baseline.
// =============================================================================

const csp = [
  `default-src 'self'`,
  // Scripts: allow same-origin + eval only in dev for hot-reload
  isDev
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
    : `script-src 'self' 'unsafe-inline'`,
  // Styles: Next.js injects styles at runtime
  `style-src 'self' 'unsafe-inline'`,
  // Images: Supabase Storage + data URIs for previews
  `img-src 'self' data: blob: https://${supabaseHostname}`,
  // Fonts
  `font-src 'self'`,
  // API / WebSocket calls: Supabase REST + Realtime
  `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
  // Frames: deny entirely (no iframes needed in a SaaS dashboard)
  `frame-src 'none'`,
  `frame-ancestors 'none'`,
  // Other fetch directives
  `media-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // Upgrade insecure requests in production
  ...(!isDev ? [`upgrade-insecure-requests`] : []),
]
  .join('; ')

// =============================================================================
// Security headers applied to every route
// =============================================================================

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  // Disallow rendering in a frame from any origin
  { key: 'X-Frame-Options',            value: 'DENY' },
  // Enable browser XSS filter (legacy browsers)
  { key: 'X-XSS-Protection',           value: '1; mode=block' },
  // HSTS: 2 years, include subdomains, preload-eligible
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Limit referrer information sent cross-origin
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by this app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // DNS prefetch for performance
  { key: 'X-DNS-Prefetch-Control',     value: 'on' },
  // CSP
  { key: 'Content-Security-Policy',    value: csp },
]

// =============================================================================
// Next.js config
// =============================================================================

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Remove the X-Powered-By: Next.js header (no need to advertise the stack)
  poweredByHeader: false,

  // Apply security headers to every route
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Allow Next.js <Image> to serve images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Formats served in order of preference (avif has the best compression)
    formats: ['image/avif', 'image/webp'],
  },

}

export default nextConfig
