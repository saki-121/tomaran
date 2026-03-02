import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeliveryForm from './_components/DeliveryForm'

export default async function NewDeliveryPage() {
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

  // 初期データをサーバーで取得してクライアントへ渡す
  const [{ data: companies }, { data: products }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
    supabase
      .from('products')
      .select('id, name, unit_price')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
  ])

  return (
    <DeliveryForm
      initialCompanies={(companies ?? []) as { id: string; name: string }[]}
      initialProducts={(products ?? []) as { id: string; name: string; unit_price: number }[]}
    />
  )
}
