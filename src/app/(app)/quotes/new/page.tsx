import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuoteForm from './_components/QuoteForm'

export default async function QuoteNewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!userTenant?.tenant_id) redirect('/onboarding')
  const tenantId = (userTenant as { tenant_id: string }).tenant_id

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
    <QuoteForm
      initialCompanies={(companies ?? []) as { id: string; name: string }[]}
      initialProducts={(products ?? []) as { id: string; name: string; unit_price: number | null }[]}
    />
  )
}
