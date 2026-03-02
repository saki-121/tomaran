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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .single()

  if (!profile?.is_paid) {
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
