// Supabase session refresh + auth/payment/onboarding guard middleware helper.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ログイン不要なパス
const PUBLIC_PREFIXES = ['/login', '/signup', '/auth', '/api', '/_next', '/legal', '/privacy']
const PUBLIC_EXACT    = ['/']

function isPublic(pathname: string) {
  return PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
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

  // /payment* は決済フロー（全ガードをスキップ）
  if (user && pathname.startsWith('/payment')) {
    return supabaseResponse
  }

  if (user && !isPublic(pathname)) {
    // ── サブスクリプションガード ────────────────────────────────────────────
    // デモブランチでは決済チェックをスキップ

    // ── 会社登録ガード（/onboarding 自体はスキップ）────────────────────────
    if (!pathname.startsWith('/onboarding')) {
      const { count } = await supabase
        .from('user_tenants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!count) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
