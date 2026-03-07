'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type InvoiceItem = {
  id: string
  site_name: string
  delivery_date: string
  product_name: string
  quantity: number
  unit_price: number
  tax_amount: number
  amount: number
}

type Invoice = {
  id: string
  invoice_number: string | null
  status: string
  closing_date: string | null
  payment_due_date: string | null
  period_from: string | null
  period_to: string | null
  total_amount: number | null
  tax_amount: number | null
  grand_total: number | null
  company: { id: string; name: string; address: string | null } | null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return d.replace(/-/g, '/')
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return '¥' + n.toLocaleString('ja-JP')
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [invoice, setInvoice]   = useState<Invoice | null>(null)
  const [items, setItems]       = useState<InvoiceItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [err, setErr]           = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch(`/api/invoices/${id}/items`).then(r => r.json()),
    ])
      .then(([invData, itemsData]) => {
        setInvoice(invData.invoice)
        setItems(itemsData.items ?? [])
      })
      .catch(() => setErr('読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const confirmInvoice = async () => {
    if (!window.confirm('この請求書を確定しますか？確定後は編集できません。')) return
    setConfirming(true)
    setErr(null)
    const res = await fetch(`/api/invoices/${id}/confirm`, { method: 'POST' })
    const d   = await res.json()
    setConfirming(false)
    if (!res.ok) { setErr(`確定エラー: ${d.error}`); return }
    load()
  }

  const preview = () => {
    window.open(`/api/invoices/${id}/preview`, '_blank')
  }

  if (loading) return <p>読み込み中…</p>
  if (!invoice) return <p style={{ color: 'red' }}>請求書が見つかりません</p>

  // Group items by site
  const siteMap = new Map<string, InvoiceItem[]>()
  for (const item of items) {
    const arr = siteMap.get(item.site_name) ?? []
    arr.push(item)
    siteMap.set(item.site_name, arr)
  }

  const isDraft = invoice.status === 'draft'
  const statusLabel = invoice.status === 'draft' ? '下書き' : '確定済み'
  const statusColor = isDraft ? { bg: '#FEF9C3', color: '#A16207' } : { bg: '#DCFCE7', color: '#16A34A' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/admin/invoices" style={{ fontSize: 13, color: '#A16207', textDecoration: 'none' }}>← 一覧</Link>
        <h2 style={{ margin: 0, flexGrow: 1, color: '#333333' }}>
          請求書
          {invoice.invoice_number ? ` #${invoice.invoice_number}` : '（下書き）'}
        </h2>
        <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 10, background: statusColor.bg, color: statusColor.color, fontWeight: 600 }}>
          {statusLabel}
        </span>

        <button onClick={preview} style={btn('#888888')}>📥 Excelダウンロード</button>
        {isDraft && (
          <button onClick={confirmInvoice} disabled={confirming} style={btn('#DC2626')}>
            {confirming ? '確定中…' : '✓ 確定する'}
          </button>
        )}
      </div>

      {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 14 }}>{err}</div>}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={cardTitle}>請求先</h3>
          <p style={cardLine}><strong>{invoice.company?.name ?? '—'}</strong></p>
          {invoice.company?.address && <p style={cardLine}>{invoice.company.address}</p>}
        </div>
        <div style={card}>
          <h3 style={cardTitle}>請求情報</h3>
          <p style={cardLine}>対象期間：{fmtDate(invoice.period_from)} ～ {fmtDate(invoice.period_to)}</p>
          <p style={cardLine}>締め日：{fmtDate(invoice.closing_date)}</p>
          <p style={cardLine}>支払期限：{fmtDate(invoice.payment_due_date)}</p>
        </div>
      </div>

      {/* Totals box */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0DA', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 380, boxShadow: '2px 2px 0 #E5E0DA' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#777777' }}>小計（税抜）</span>
          <span style={{ color: '#555555' }}>{fmtNum(invoice.total_amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#777777' }}>消費税（10%）</span>
          <span style={{ color: '#555555' }}>{fmtNum(invoice.tax_amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E0DA', paddingTop: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#333333' }}>合計（税込）</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#A16207' }}>{fmtNum(invoice.grand_total)}</span>
        </div>
      </div>

      {/* Items grouped by site */}
      <h3 style={{ marginBottom: 12, color: '#333333' }}>明細</h3>
      {siteMap.size === 0 ? (
        <p style={{ color: '#888888' }}>明細がありません（締め日に一致する納品がない場合、生成されません）</p>
      ) : (
        Array.from(siteMap.entries()).map(([siteName, siteItems]) => {
          const siteTotal = siteItems.reduce((s, i) => s + i.amount, 0)
          return (
            <div key={siteName} style={{ marginBottom: 24 }}>
              <div style={{ background: '#E8F0FE', padding: '8px 14px', borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: 14, color: '#333333' }}>
                ■ {siteName}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', border: '1px solid #E5E0DA', boxShadow: '2px 2px 0 #E5E0DA' }}>
                <thead>
                  <tr style={{ background: '#F5F0EB' }}>
                    {['日付', '品名', '数量', '単価', '金額'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === '日付' || h === '品名' ? 'left' : 'right', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #E5E0DA', color: '#777777' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {siteItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                      <td style={itd}>{fmtDate(item.delivery_date)}</td>
                      <td style={itd}>{item.product_name}</td>
                      <td style={{ ...itd, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ ...itd, textAlign: 'right' }}>{fmtNum(item.unit_price)}</td>
                      <td style={{ ...itd, textAlign: 'right', color: '#A16207', fontWeight: 600 }}>{fmtNum(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#F5F0EB', fontWeight: 600 }}>
                    <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13, color: '#777777' }}>小計</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13, color: '#A16207' }}>{fmtNum(siteTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })
      )}

      {/* Confirm warning */}
      {isDraft && items.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '12px 16px', marginTop: 8, fontSize: 13, color: '#92400E' }}>
          ⚠️ 確定後は納品データが「請求済み」に変わり、この請求書・納品の編集・削除が不可になります。
          納品漏れがあっても次回締めで請求してください（例外ルートなし）。
        </div>
      )}
    </div>
  )
}

const btn = (bg: string): React.CSSProperties => ({ padding: '8px 18px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 })
const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 8, padding: 16, border: '1px solid #E5E0DA', boxShadow: '2px 2px 0 #E5E0DA' }
const cardTitle: React.CSSProperties = { margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#777777', borderBottom: '1px solid #F0EDE8', paddingBottom: 6 }
const cardLine: React.CSSProperties = { margin: '4px 0', fontSize: 14, color: '#555555' }
const itd: React.CSSProperties = { padding: '8px 10px', fontSize: 14, color: '#555555' }
