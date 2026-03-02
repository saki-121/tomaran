import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match every route except:
     *   • Next.js internals  (_next/static, _next/image)
     *   • Static files with a file extension (favicon.ico, robots.txt, etc.)
     *
     * This ensures the Supabase session is refreshed on every server-rendered
     * page and API route without paying the overhead on pure static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
