'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Product = {
  id: string
  name: string
  spec: string | null
  unit_price: number | null
  tax_rate: number
  status: string
}

type LineItem = {
  product: Product
  quantity: number
}

export default function QuotesPage() {
  const [products, setProducts]       = useState<Product[]>([])
  const [search, setSearch]           = useState('')
  const [lineItems, setLineItems]     = useState<LineItem[]>([])
  const [recipient, setRecipient]     = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetch('/api/masters/products?all=1')
      .then(r => r.json())
      .then((d: { products?: Product[] }) =>
        setProducts((d.products ?? []).filter(p => p.status === 'active'))
      )
  }, [])

  const subtotal   = lineItems.reduce((s, i) => s + (i.product.unit_price ?? 0) * i.quantity, 0)
  const tax        = Math.floor(subtotal * 0.1)
  const grandTotal = subtotal + tax
  const today      = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const label = [p.name, p.spec].filter(Boolean).join(' ').toLowerCase()
    return label.includes(q)
  })

  function addProduct(product: Product) {
    setLineItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeItem(productId: string) {
    setLineItems(prev => prev.filter(i => i.product.id !== productId))
  }

  function setQuantity(productId: string, qty: number) {
    if (qty < 1) return
    setLineItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
  }

  function productLabel(p: Product): string {
    return p.spec ? `${p.name}（${p.spec}）` : p.name
  }

  // ── プレビュービュー ──────────────────────────────────────────────────────
  if (showPreview) {
    return (
      <>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; background: #fff; }
          }
        `}</style>

        <div
          className="no-print"
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowPreview(false)}
            style={btnSecondaryStyle}
          >
            ← 戻る
          </button>
          <button
            onClick={() => window.print()}
            style={btnPrimaryStyle}
          >
            印刷 / PDF保存
          </button>
        </div>

        <div
          ref={printRef}
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '32px 24px',
            fontFamily: 'sans-serif',
          }}
        >
          <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 4 }}>御見積書</h1>
          <p style={{ textAlign: 'right', color: '#555', marginTop: 0 }}>発行日: {today}</p>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
              {recipient || '　'} 御中
            </p>
            <p style={{ color: '#444', margin: 0 }}>下記の通りお見積り申し上げます。</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>品名</th>
                <th style={{ ...thStyle, width: 60, textAlign: 'center' }}>数量</th>
                <th style={{ ...thStyle, width: 90, textAlign: 'right' }}>単価</th>
                <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <tr key={item.product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{productLabel(item.product)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {item.product.unit_price !== null
                      ? `¥${item.product.unit_price.toLocaleString('ja-JP')}`
                      : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    ¥{((item.product.unit_price ?? 0) * item.quantity).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
              合計（税抜き）　¥{subtotal.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
              消費税（10%）　¥{tax.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              税込合計　¥{grandTotal.toLocaleString('ja-JP')}
            </p>
          </div>

          <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 32 }}>
            有効期限：発行日より30日
          </p>
        </div>
      </>
    )
  }

  // ── 作成ビュー ────────────────────────────────────────────────────────────
  return (
    <main style={mainStyle}>
      {/* ヘッダー */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
          marginBottom: 16,
        }}
      >
        <Link href="/deliveries" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 15 }}>
          ← 戻る
        </Link>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' }}>見積書作成</span>
        <span style={{ width: 48 }} />
      </div>

      <div style={{ padding: '0 16px 120px' }}>
        {/* 宛先 */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>宛先</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="例: ○○建設"
              style={inputStyle}
            />
            <span style={{ fontSize: 14, color: '#374151', whiteSpace: 'nowrap' }}>御中</span>
          </div>
        </div>

        {/* 商品絞り込み */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>商品を選択</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 品名で絞り込み..."
            style={inputStyle}
          />
        </div>

        {/* 商品リスト */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredProducts.map(p => (
            <li
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#f9fafb',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                gap: 8,
              }}
            >
              <span style={{ flex: 1, fontSize: 14, color: '#111827' }}>{productLabel(p)}</span>
              <span style={{ fontSize: 13, color: p.unit_price !== null ? '#374151' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {p.unit_price !== null ? `¥${p.unit_price.toLocaleString('ja-JP')}` : '単価未設定'}
              </span>
              <button
                onClick={() => addProduct(p)}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  fontSize: 20,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label={`${productLabel(p)}を追加`}
              >
                ＋
              </button>
            </li>
          ))}
          {filteredProducts.length === 0 && (
            <li style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
              該当する商品がありません
            </li>
          )}
        </ul>

        {/* 見積内容 */}
        {lineItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px', letterSpacing: '0.05em' }}>
              ── 見積内容（追加済み商品） ──────────
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lineItems.map(item => (
                <li
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13, color: '#111827' }}>{productLabel(item.product)}</span>
                  <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    数量:
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => setQuantity(item.product.id, Number(e.target.value))}
                      style={{
                        width: 64,
                        marginLeft: 4,
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        fontSize: 13,
                        textAlign: 'right',
                      }}
                    />
                  </label>
                  <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap', minWidth: 64, textAlign: 'right' }}>
                    ¥{((item.product.unit_price ?? 0) * item.quantity).toLocaleString('ja-JP')}
                  </span>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    style={{
                      minWidth: 36,
                      minHeight: 36,
                      background: 'none',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="削除"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            {/* 合計ブロック */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 8, textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
                合計（税抜き）　¥{subtotal.toLocaleString('ja-JP')}
              </p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
                消費税（10%）　¥{tax.toLocaleString('ja-JP')}
              </p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                税込合計　¥{grandTotal.toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        )}

        {/* 見積書を作るボタン */}
        <button
          onClick={() => setShowPreview(true)}
          disabled={lineItems.length === 0}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 16,
            fontWeight: 700,
            background: lineItems.length > 0 ? '#2563eb' : '#e5e7eb',
            color: lineItems.length > 0 ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: 8,
            cursor: lineItems.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          見積書を作る →
        </button>
      </div>
    </main>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const mainStyle: React.CSSProperties = {
  maxWidth: 448,
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#f9fafb',
  minHeight: '100dvh',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: 4,
  letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 15,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  boxSizing: 'border-box',
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 14,
  color: '#111827',
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 15,
  fontWeight: 700,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  minHeight: 44,
}

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 15,
  background: 'none',
  color: '#2563eb',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
  minHeight: 44,
}
