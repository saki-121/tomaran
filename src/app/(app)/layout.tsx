import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // テナントチェック（会社名未登録なら onboarding へ）
  const { count } = await supabase
    .from('user_tenants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (!count) redirect('/onboarding')

  return <>{children}</>
}
