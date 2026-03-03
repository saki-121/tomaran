'use client'

import { useState } from 'react'

export default function PaymentActions({ isCanceled = false }: { isCanceled?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch('/api/create-checkout-session', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        onClick={() => void handleCheckout()}
        disabled={loading}
        style={{
          width: '100%',
          padding: '13px 0',
          background: loading ? '#93c5fd' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '処理中…' : isCanceled ? '再購入する' : 'サブスクリプションを購入する'}
      </button>
    </div>
  )
}
