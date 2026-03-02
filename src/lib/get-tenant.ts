// ---------------------------------------------------------------------------
// getTenant — Route Handler 共通ヘルパー
//
// 使い方:
//   const supabase = await createClient()
//   const { tenantId, error } = await getTenant(supabase)
//   if (error) return NextResponse.json({ error }, { status: 401 })
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTenant(supabase: any): Promise<
  | { tenantId: string; error: null }
  | { tenantId: null; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { tenantId: null, error: 'Unauthorized' }

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!data?.tenant_id) {
    return { tenantId: null, error: 'No tenant' }
  }

  return { tenantId: data.tenant_id as string, error: null }
}
