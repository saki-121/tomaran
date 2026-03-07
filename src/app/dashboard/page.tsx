import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenants(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const tenantName = userTenant?.tenants?.name
  if (!tenantName) {
    redirect('/onboarding')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_paid, subscription_status')
    .eq('id', user.id)
    .single()

  // subscription_status が active/trialing のどちらでもなければブロック
  // (webhook で canceled/past_due 等に更新された場合もここで弾く)
  const status = (profile?.subscription_status ?? '') as string
  const isActive = status === 'active' || status === 'trialing'

  if (!isActive) {
    redirect('/payment-required')
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {user.id}</p>
      <p>Tenant: {tenantName}</p>
    </div>
  )
}
