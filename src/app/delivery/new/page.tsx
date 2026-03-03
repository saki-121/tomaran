import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FieldDeliveryForm from './_components/FieldDeliveryForm'

export default async function NewFieldDeliveryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .single()
  if (!profile?.is_paid) redirect('/payment-required')

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id, tenants(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!userTenant?.tenants?.name) redirect('/onboarding')

  const tenantId = (userTenant as { tenant_id: string }).tenant_id

  // --- /delivery/new: products は id, name のみ取得 — unit_price は取得しない ---
  const [{ data: companies }, { data: products }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
    supabase
      .from('products')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
  ])

  return (
    <FieldDeliveryForm
      initialCompanies={(companies ?? []) as { id: string; name: string }[]}
      initialProducts={(products ?? []) as { id: string; name: string }[]}
    />
  )
}
