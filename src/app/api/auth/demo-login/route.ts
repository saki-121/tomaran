import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/deliveries'

  const cookieStore = await cookies()
  const response = NextResponse.redirect(new URL(next, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // 既にログイン済みならそのままリダイレクト
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return response

  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_USER_EMAIL!,
    password: process.env.DEMO_USER_PASSWORD!,
  })

  if (error) {
    console.error('Demo login failed:', error.message)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
