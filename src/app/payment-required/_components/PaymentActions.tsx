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
          padding: '15px 0',
          background: loading ? 'rgba(255,215,0,0.5)' : '#FFD700',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '処理中…' : isCanceled ? '再購入する →' : '決済に進む →'}
      </button>
    </div>
  )
}
