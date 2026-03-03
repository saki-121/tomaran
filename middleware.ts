import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
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
