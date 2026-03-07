// Supabase session refresh + 未認証ガード
// サブスク・テナントチェックは (app)/layout.tsx で行う

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ログイン不要なパス
const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/api', '/_next', '/legal', '/privacy', '/payment']
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
  const { data: { user } } = await supabase.auth.getUser()

  // ── 未認証ガード ─────────────────────────────────────────────────────────
  if (!user && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
