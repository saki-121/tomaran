import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentActions from './_components/PaymentActions'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          会社登録が完了しました
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          サービスを利用するにはお支払いが必要です。
        </p>
        <PaymentActions />
      </div>
    </div>
  )
}
