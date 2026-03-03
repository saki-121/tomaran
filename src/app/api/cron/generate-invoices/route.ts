// POST /api/cron/generate-invoices
//
// Daily batch called by scheduler (e.g. Vercel Cron at 01:00 UTC = 10:00 JST).
// Auth: x-cron-secret header must match env CRON_SECRET.
//
// vercel.json:
//   { "crons": [{ "path": "/api/cron/generate-invoices", "schedule": "0 1 * * *" }] }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
    ?? req.headers.get('authorization')?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = todayJST()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('generate_invoices_for_date', {
    p_date: date,
  })

  if (error) {
    console.error('[cron/generate-invoices] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = data ?? []
  const summary = {
    date,
    total:    results.length,
    created:  results.filter(r => r.r_result === 'created').length,
    skipped:  results.filter(r => r.r_result === 'skipped').length,
    no_items: results.filter(r => r.r_result === 'no_items').length,
  }

  console.log('[cron/generate-invoices]', summary)
  return NextResponse.json(summary)
}
