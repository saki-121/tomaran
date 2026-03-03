// Supabase session refresh + auth/payment guard middleware helper.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ログイン不要なパス
const PUBLIC_PREFIXES = ['/login', '/auth', '/api', '/_next', '/legal', '/privacy']
const PUBLIC_EXACT    = ['/']

// ログイン必須だが支払い不要なパス
const SEMI_PROTECTED_PREFIXES = ['/payment', '/onboarding']

function isPublic(pathname: string) {
  return PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
}

function isSemiProtected(pathname: string) {
  return SEMI_PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // セッション更新（必須・削除不可）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 未認証ガード ─────────────────────────────────────────────────────────
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── 未払いガード（保護ルートのみ）───────────────────────────────────────
  if (user && !isPublic(pathname) && !isSemiProtected(pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_paid')
      .eq('id', user.id)
      .maybeSingle()

    // profile が存在して未払いの場合のみリダイレクト
    // （profile なし = 新規ユーザー → onboarding フローに任せる）
    if (profile && !profile.is_paid) {
      const url = request.nextUrl.clone()
      url.pathname = '/payment-required'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
