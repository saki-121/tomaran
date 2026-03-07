import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // サブスクリプションチェック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  const status = profile?.subscription_status as string | undefined
  if (status !== 'active' && status !== 'trialing') {
    redirect('/payment-required')
  }

  // テナントチェック
  const { count } = await supabase
    .from('user_tenants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (!count) redirect('/onboarding')

  return <>{children}</>
}
