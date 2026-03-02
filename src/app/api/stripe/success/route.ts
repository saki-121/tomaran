import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/payment-required', req.url))
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') {
    return NextResponse.redirect(new URL('/payment-required', req.url))
  }

  const email = session.customer_email
  if (!email) {
    return NextResponse.redirect(new URL('/payment-required', req.url))
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_paid: true })
    .eq('id', session.client_reference_id!)

  if (error) {
    console.error('profiles update failed:', error.message)
    return NextResponse.redirect(new URL('/payment-required', req.url))
  }

  return NextResponse.redirect(new URL('/login?paid=true', req.url))
}
