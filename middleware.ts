import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// UA判定
// ---------------------------------------------------------------------------

const MOBILE_UA = /Mobile|Android|iPhone|iPad/i

// UA分岐を適用するパスのみ（/deliveries 以下・API・静的ファイルは対象外）
const UA_SPLIT_PATHS = new Set(['/', '/dashboard'])

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // 1. Supabase セッション更新（必ず最初に実行。削除禁止）
  const sessionRes = await updateSession(request)

  // 2. UA分岐対象パス以外はそのまま返す
  const { pathname } = request.nextUrl
  if (!UA_SPLIT_PATHS.has(pathname)) {
    return sessionRes
  }

  // 3. updateSession が認証リダイレクトを返した場合はそのまま返す
  //    （未ログインユーザーはセッションミドルウェアに任せる）
  if (sessionRes.status >= 300 && sessionRes.status < 400) {
    return sessionRes
  }

  // 4. UA判定でターゲットを決定
  const ua = request.headers.get('user-agent') ?? ''
  const isMobile = MOBILE_UA.test(ua)
  const target = isMobile ? '/deliveries' : '/dashboard'

  // 5. 無限リダイレクト防止：すでにターゲットにいる場合はスキップ
  if (pathname === target) {
    return sessionRes
  }

  // 6. リダイレクト＋セッション Cookie 引き継ぎ
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = target
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
