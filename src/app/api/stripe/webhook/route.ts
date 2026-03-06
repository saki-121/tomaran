// POST /api/stripe/webhook
//
// Stripe Webhook 受信・署名検証・イベント処理・ログ保存
//
// 受信イベント:
//   checkout.session.completed       — 初回決済完了
//   invoice.payment_succeeded        — サブスク継続課金成功
//   payment_intent.succeeded         — 一回払い決済成功
//   customer.subscription.created    — サブスク開始
//   customer.subscription.updated    — サブスク状態変化
//   customer.subscription.deleted    — サブスク解約

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Next.js App Router: body を raw text で読むため bodyParser 不要
export const dynamic = 'force-dynamic'

// ── エントリーポイント ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body   = await req.text()
  const sig    = (await headers()).get('stripe-signature') ?? ''

  // ── 署名検証 ────────────────────────────────────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'signature verification failed'
    console.error('[stripe/webhook] 署名検証エラー:', msg)
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── ログ: 受信記録（pending） ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logRow } = await (supabase as any)
    .from('stripe_webhook_logs')
    .insert({
      event_id:   event.id,
      event_type: event.type,
      payload:    event,
      status:     'pending',
    })
    .select('id')
    .single()

  const logId = (logRow as { id: string } | null)?.id

  // ── ログ更新ヘルパー ─────────────────────────────────────────────────────
  async function updateLog(status: 'success' | 'error' | 'ignored', error_message?: string) {
    if (!logId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('stripe_webhook_logs')
      .update({ status, error_message: error_message ?? null })
      .eq('id', logId)
  }

  // ── イベント処理 ─────────────────────────────────────────────────────────
  try {
    const handled = await dispatchEvent(event, supabase)
    await updateLog(handled ? 'success' : 'ignored')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[stripe/webhook] ハンドラエラー (${event.type}):`, msg)
    await updateLog('error', msg)
    // 200 を返すことで Stripe の無限リトライを防ぐ
    // ロジックエラーはログから手動対応。ネットワーク障害時は Stripe が自動リトライ。
  }

  return NextResponse.json({ received: true })
}

// ── イベントディスパッチャー ──────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

async function dispatchEvent(event: Stripe.Event, supabase: AdminClient): Promise<boolean> {
  switch (event.type) {

    // ── 初回 Checkout 完了 ──────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session    = event.data.object as Stripe.Checkout.Session
      const userId     = session.metadata?.user_id
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id ?? null

      if (!userId) {
        console.warn('[webhook] checkout.session.completed: metadata.user_id なし')
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          is_paid:             true,
          subscription_status: 'active',
          ...(customerId ? { stripe_customer_id: customerId } : {}),
        })
        .eq('id', userId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── サブスク継続課金成功 ────────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as Stripe.Customer | null)?.id ?? null

      if (!customerId) {
        console.warn('[webhook] invoice.payment_succeeded: customer ID なし')
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_paid: true, subscription_status: 'active' })
        .eq('stripe_customer_id', customerId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── 一回払い決済成功 ────────────────────────────────────────────────
    case 'payment_intent.succeeded': {
      // サブスク課金は invoice 経由なのでここは主に one-time 決済
      const pi     = event.data.object as Stripe.PaymentIntent
      const userId = pi.metadata?.user_id
      if (!userId) return false  // サブスクの場合は無視

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_paid: true, subscription_status: 'active' })
        .eq('id', userId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── サブスク新規開始 ────────────────────────────────────────────────
    case 'customer.subscription.created': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string'
        ? sub.customer
        : (sub.customer as Stripe.Customer).id

      const isPaid = sub.status === 'active'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          subscription_status: sub.status,
          is_paid:             isPaid,
        })
        .eq('stripe_customer_id', customerId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── サブスク状態変化 ────────────────────────────────────────────────
    // status: active | past_due | unpaid | canceled | incomplete | trialing
    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string'
        ? sub.customer
        : (sub.customer as Stripe.Customer).id

      const isPaid = sub.status === 'active' || sub.status === 'trialing'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          is_paid:             isPaid,
          subscription_status: sub.status,
        })
        .eq('stripe_customer_id', customerId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── サブスク解約完了 ────────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string'
        ? sub.customer
        : (sub.customer as Stripe.Customer).id

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_paid: false, subscription_status: 'canceled' })
        .eq('stripe_customer_id', customerId)

      if (error) throw new Error(`profiles update failed: ${error.message}`)
      return true
    }

    // ── 未対応イベント（ログは ignored で保存） ─────────────────────────
    default:
      return false
  }
}
