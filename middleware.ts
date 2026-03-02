import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// UA判定
// ---------------------------------------------------------------------------

const MOBILE_UA = /Mobile|Android|iPhone|iPad/i

// ---------------------------------------------------------------------------
// エリア制限 — 許可プレフィックスリスト
// ---------------------------------------------------------------------------

const MOBILE_ALLOWED = [
  '/deliveries',
  '/api',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/login',
  '/onboarding',
  '/payment-required',
  '/payment-success',
]

const PC_ALLOWED = [
  '/dashboard',
  '/api',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/login',
  '/onboarding',
  '/payment-required',
  '/payment-success',
]

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // 1. Supabase セッション更新（必ず最初に実行。削除禁止）
  const sessionRes = await updateSession(request)

  // 2. updateSession が認証リダイレクトを返した場合はそのまま返す
  if (sessionRes.status >= 300 && sessionRes.status < 400) {
    return sessionRes
  }

  // 3. UA判定
  const ua       = request.headers.get('user-agent') ?? ''
  const isMobile = MOBILE_UA.test(ua)
  const allowedPaths = isMobile ? MOBILE_ALLOWED : PC_ALLOWED
  const home         = isMobile ? '/deliveries'  : '/dashboard'

  // 4. 許可パス判定
  const { pathname } = request.nextUrl
  const isAllowed = allowedPaths.some(
    p => pathname === p || pathname.startsWith(p + '/'),
  )
  if (isAllowed) {
    return sessionRes
  }

  // 5. 無限リダイレクト防止
  if (pathname === home) {
    return sessionRes
  }

  // 6. 非許可パス → ホームへリダイレクト＋セッション Cookie 引き継ぎ
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = home
  const redirectRes = NextResponse.redirect(redirectUrl)

  sessionRes.cookies.getAll().forEach(c => {
    redirectRes.cookies.set(c.name, c.value, {
      path:     c.path,
      domain:   c.domain,
      maxAge:   c.maxAge,
      httpOnly: c.httpOnly,
      secure:   c.secure,
      sameSite: c.sameSite as 'lax' | 'strict' | 'none' | undefined,
    })
  })

  return redirectRes
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのルートを対象：
     *   • Next.js 内部 (_next/static, _next/image)
     *   • 静的ファイル (svg, png, jpg, …)
     */
    '/((?!_next).*)',
  ],
}
