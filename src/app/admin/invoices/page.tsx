'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Invoice = {
  id: string
  invoice_number: string | null
  status: string
  closing_date: string | null
  period_from: string | null
  period_to: string | null
  total_amount: number | null
  tax_amount: number | null
  grand_total: number | null
  company: { id: string; name: string } | null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return d.replace(/-/g, '/')
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return '¥' + n.toLocaleString('ja-JP')
}

const STATUS_LABEL: Record<string, string> = { draft: '下書き', confirmed: '確定済み' }
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  draft:     { bg: '#fff3cd', color: '#856404' },
  confirmed: { bg: '#d4edda', color: '#155724' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter]     = useState<'all' | 'draft' | 'confirmed'>('all')
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg]     = useState<string | null>(null)
  const [genDate, setGenDate]   = useState(() => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
    return now.toISOString().split('T')[0]
  })

  const load = () => {
    setLoading(true)
    fetch('/api/invoices')
      .then(r => r.json())
      .then(d => setInvoices(d.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const generate = async () => {
    setGenerating(true)
    setGenMsg(null)
    const res = await fetch('/api/invoices/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: genDate }),
    })
    const d = await res.json()
    setGenerating(false)
    if (!res.ok) { setGenMsg(`エラー: ${d.error}`); return }
    const created = d.results?.filter((r: { r_result: string }) => r.r_result === 'created').length ?? 0
    const skipped = d.results?.filter((r: { r_result: string }) => r.r_result === 'skipped').length ?? 0
    setGenMsg(`${genDate}: 新規作成 ${created}件、スキップ ${skipped}件`)
    load()
  }

  const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>請求書一覧</h2>

        {/* Manual generation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={genDate}
            onChange={e => setGenDate(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
          />
          <button onClick={generate} disabled={generating} style={btn('#2e7d32')}>
            {generating ? '生成中…' : '請求書を生成'}
          </button>
        </div>
      </div>

      {genMsg && (
        <div style={{ background: genMsg.startsWith('エラー') ? '#fee' : '#efd', border: '1px solid', borderColor: genMsg.startsWith('エラー') ? '#c00' : '#6a0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {genMsg}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'draft', 'confirmed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 13,
            background: filter === f ? '#1a1a2e' : '#fff',
            color:      filter === f ? '#fff' : '#333',
          }}>
            {f === 'all' ? '全て' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? <p>読み込み中…</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['会社名', '対象期間', '締め日', '合計（税込）', '状態', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #ddd' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const sc = STATUS_COLOR[inv.status] ?? { bg: '#eee', color: '#333' }
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{inv.company?.name ?? '—'}</td>
                  <td style={td}>
                    {inv.period_from ? `${fmtDate(inv.period_from)} ～ ${fmtDate(inv.period_to)}` : '—'}
                  </td>
                  <td style={td}>{fmtDate(inv.closing_date)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtNum(inv.grand_total)}</td>
                  <td style={td}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <Link href={`/admin/invoices/${inv.id}`} style={{ fontSize: 13, color: '#1a1a2e', textDecoration: 'none', padding: '4px 10px', border: '1px solid #1a1a2e', borderRadius: 4 }}>
                      詳細
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#888' }}>請求書がありません</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

const td  = { padding: '10px 12px', fontSize: 14, verticalAlign: 'middle' as const }
const btn = (bg: string): React.CSSProperties => ({ padding: '8px 18px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 })
