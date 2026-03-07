import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (session_id) {
    try {
      const stripe     = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const supabase   = await createClient()
      const admin      = createAdminClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('[payment-success] user not found in session')
      } else {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
          expand: ['subscription'],
        })
        if (session.payment_status === 'paid') {
          const customerId     = typeof session.customer === 'string'
            ? session.customer
            : (session.customer as { id?: string } | null)?.id ?? null
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as { id?: string } | null)?.id ?? null

          // mark_user_as_paid RPC: is_paid = true + subscription_status = 'active'
          // SECURITY DEFINER 関数なので RLS をバイパスして安全に更新できる
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: rpcError } = await (supabase as any).rpc('mark_user_as_paid', {
            target_user_id: user.id,
          })
          if (rpcError) {
            console.error('[payment-success] mark_user_as_paid failed:', rpcError)
          }

          // Stripe ID の書き込みは admin client で行う（profiles に UPDATE RLS policy なし）
          // webhook でも書かれるが、ここで先行して書くことでリダイレクト直後も反映される
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (admin as any)
            .from('profiles')
            .update({
              ...(customerId     ? { stripe_customer_id:      customerId     } : {}),
              ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
            })
            .eq('id', user.id)
          if (updateError) {
            console.error('[payment-success] stripe ID update failed:', updateError)
          }
        }
      }
    } catch (err) {
      console.error('[payment-success] error:', err)
    }
  }

  redirect('/onboarding')
}
