import Link from 'next/link'

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">決済完了しました</h1>
        <p className="mb-8 text-sm text-gray-500">
          サービスをご利用いただけます。
        </p>
        <Link
          href="/deliveries"
          className="inline-block w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
        >
          納品一覧へ
        </Link>
      </div>
    </div>
  )
}
