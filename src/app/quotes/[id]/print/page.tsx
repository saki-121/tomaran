import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { createRepositories } from '@/repositories'
import QuotePrint from '@/components/QuotePrint'

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const repos = createRepositories(supabase)

  const quote = await repos.quotes.findById(id)
  if (!quote) notFound()

  return <QuotePrint quote={quote} />
}
