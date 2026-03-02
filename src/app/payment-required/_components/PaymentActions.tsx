'use client'

export default function PaymentActions() {
  async function handleCheckout() {
    const res = await fetch('/api/create-checkout-session', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleCancel() {
    await fetch('/api/delete-company', { method: 'POST' })
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleCheckout}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
      >
        お支払いへ
      </button>
      <button
        onClick={handleCancel}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100"
      >
        登録をキャンセル
      </button>
    </div>
  )
}
