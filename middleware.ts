import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// Device detection — 初回アクセス時のみ使用
// ---------------------------------------------------------------------------

function detectDevice(request: NextRequest): 'mobile' | 'desktop' {
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile')
  if (secChUaMobile !== null) {
    return secChUaMobile === '?1' ? 'mobile' : 'desktop'
  }
  const ua = request.headers.get('user-agent') ?? ''
  return /iphone|android|mobile/i.test(ua) ? 'mobile' : 'desktop'
}

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
// device cookie 設定
// ---------------------------------------------------------------------------

const DEVICE_COOKIE = {
  name:     'device',
  httpOnly: false,
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 24 * 30, // 30日
}

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

  // 3. device cookie を確認
  //    存在する場合はそれを最優先使用（UA・headers は一切見ない）
  //    存在しない初回のみ detectDevice() を実行して cookie を固定する
  const savedDevice = request.cookies.get(DEVICE_COOKIE.name)?.value
  const isFirstVisit = savedDevice !== 'mobile' && savedDevice !== 'desktop'
  const device: 'mobile' | 'desktop' = isFirstVisit
    ? detectDevice(request)
    : (savedDevice as 'mobile' | 'desktop')

  const isMobile    = device === 'mobile'
  const allowedPaths = isMobile ? MOBILE_ALLOWED : PC_ALLOWED
  const home         = isMobile ? '/deliveries'  : '/dashboard'

  // 4. 許可パス判定 / 無限リダイレクト防止
  const { pathname } = request.nextUrl
  const isAllowed = allowedPaths.some(p => pathname.startsWith(p))

  if (isAllowed || pathname === home) {
    // 初回のみ cookie を response に付与
    if (isFirstVisit) {
      sessionRes.cookies.set(DEVICE_COOKIE.name, device, DEVICE_COOKIE)
    }
    return sessionRes
  }

  // 5. 非許可パス → ホームへリダイレクト＋セッション Cookie 引き継ぎ
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

  // 初回のみ device cookie をリダイレクト response にも付与
  if (isFirstVisit) {
    redirectRes.cookies.set(DEVICE_COOKIE.name, device, DEVICE_COOKIE)
  }

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
