import type { ReactNode } from 'react'
import MobileNav from '@/app/_components/MobileNav'
import { createClient } from '@/lib/supabase/server'

export default async function DeliveriesLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let tenantName: string | null = null
  if (user) {
    const { data } = await supabase
      .from('user_tenants')
      .select('tenants(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    tenantName = (data?.tenants as { name?: string } | null)?.name ?? null
  }

  return (
    <>
      <MobileNav tenantName={tenantName} />
      {children}
    </>
  )
}
