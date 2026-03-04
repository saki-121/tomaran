import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return new NextResponse('Webhook Error', { status: 400 })
  }

  const supabase = createAdminClient()

  // ── 購入完了 ─────────────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    if (userId) {
      await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ is_paid: true } as any)
        .eq('id', userId)
    }
  }

  // ── 解約完了（Stripe側でキャンセル処理が完了したとき）──────────────────
  if (
    event.type === 'customer.subscription.deleted' ||
    (event.type === 'customer.subscription.updated' &&
      (event.data.object as Stripe.Subscription).status === 'canceled')
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const customerId   = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

    await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_paid: false, subscription_status: 'canceled' } as any)
      .eq('stripe_customer_id' as any, customerId)
  }

  return NextResponse.json({ received: true })
}
