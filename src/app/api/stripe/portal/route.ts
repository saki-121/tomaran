// POST /api/stripe/portal
// Stripe Billing Portal セッションを生成して URL を返す

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // stored customer_id を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  let customerId: string | null = profile?.stripe_customer_id ?? null

  // フォールバック: メールで Stripe 顧客を検索（stripe_customer_id 未保存の既存ユーザー向け）
  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      // 次回のために保存
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }
  }

  if (!customerId) {
    return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${siteUrl}/admin`,
  })

  return NextResponse.json({ url: portalSession.url })
}
