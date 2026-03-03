'use client'

import { useEffect, useRef, useState } from 'react'

type Product = {
  id: string
  name: string
  spec: string | null
  unit_price: number | null
  tax_rate: number
  status: string
  active_flag: boolean
}

type FormData = { name: string; unit_price: string; status: string }

const emptyForm: FormData = { name: '', unit_price: '', status: 'active' }

function toForm(p: Product): FormData {
  return { name: p.name, unit_price: p.unit_price !== null ? String(p.unit_price) : '', status: p.status }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter]     = useState<'all' | 'active' | 'provisional'>('all')
  const [editing, setEditing]   = useState<string | null>(null)
  const [form, setForm]         = useState<FormData>(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/masters/products?all=1')
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = products.filter(p => {
    if (filter === 'active')      return p.status === 'active'
    if (filter === 'provisional') return p.status === 'provisional'
    return true
  })

  const startNew  = () => { setForm(emptyForm); setEditing('new'); setErr(null) }
  const startEdit = (p: Product) => { setForm(toForm(p)); setEditing(p.id); setErr(null) }
  const cancel    = () => { setEditing(null); setErr(null) }

  const save = async () => {
    if (!form.name.trim()) { setErr('名称は必須です'); return }
    setSaving(true); setErr(null)
    const url    = editing === 'new' ? '/api/masters/products' : `/api/masters/products/${editing}`
    const method = editing === 'new' ? 'POST' : 'PUT'
    const body   = {
      name:       form.name.trim(),
      unit_price: form.unit_price === '' ? null : Number(form.unit_price),
      status:     form.status,
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d   = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(d.error); return }
    cancel()
    load()
  }

  const remove = async (id: string, n: string) => {
    if (!confirm(`「${n}」を無効化しますか？`)) return
    await fetch(`/api/masters/products/${id}`, { method: 'DELETE' })
    load()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/masters/products/import', { method: 'POST', body: fd })
    const d   = await res.json()
    setImporting(false)
    e.target.value = ''
    if (!res.ok) { setImportMsg(`エラー: ${d.error}`); return }
    setImportMsg(`完了: 新規 ${d.created}件、更新 ${d.updated}件、スキップ ${d.skipped}件${d.errors?.length ? `\nエラー: ${d.errors.join(', ')}` : ''}`)
    load()
  }

  const inp = (label: string, key: keyof FormData, type = 'text') => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '1' : undefined}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>商品マスタ</h2>
        <button onClick={startNew} style={btn('#1a1a2e')}>＋ 新規追加</button>

        {/* Excel Import */}
        <button onClick={() => fileRef.current?.click()} disabled={importing} style={btn('#2e7d32')}>
          {importing ? 'インポート中…' : '📥 Excel取り込み'}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
        <a
          href="#"
          onClick={e => {
            e.preventDefault()
            alert('A列:品名　B列:単価（省略可）\n1行目はヘッダ行（スキップされます）')
          }}
          style={{ fontSize: 12, color: '#555' }}
        >
          フォーマット確認
        </a>

        {/* Filter */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['all', 'active', 'provisional'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 13,
              background: filter === f ? '#1a1a2e' : '#fff',
              color:      filter === f ? '#fff' : '#333',
            }}>
              {f === 'all' ? '全て' : f === 'active' ? '有効' : '単価未設定'}
            </button>
          ))}
        </div>
      </div>

      {importMsg && (
        <div style={{ background: importMsg.startsWith('エラー') ? '#fee' : '#efd', border: '1px solid', borderColor: importMsg.startsWith('エラー') ? '#c00' : '#6a0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, whiteSpace: 'pre-wrap' }}>
          {importMsg}
        </div>
      )}

      {editing && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 440 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>{editing === 'new' ? '新規商品' : '商品を編集'}</h3>
          {inp('品名（規格込み） *', 'name')}
          {inp('単価（空白 = 仮登録）', 'unit_price', 'number')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>ステータス</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}>
              <option value="active">有効（請求対象）</option>
              <option value="provisional">仮登録（単価未設定）</option>
            </select>
          </div>
          {err && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={btn('#1a1a2e')}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={cancel} style={btn('#888')}>キャンセル</button>
          </div>
        </div>
      )}

      {loading ? <p>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            {filtered.length}件表示
            {filter !== 'all' && ` / 全${products.length}件`}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                {['品名', '単価（税抜）', 'ステータス', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #ddd' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee', opacity: p.active_flag ? 1 : 0.5 }}>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>
                    {p.unit_price !== null
                      ? `¥${p.unit_price.toLocaleString('ja-JP')}`
                      : <span style={{ color: '#e00' }}>未設定</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 12, padding: '2px 8px', borderRadius: 10,
                      background: p.status === 'active' ? '#d4edda' : '#fff3cd',
                      color:      p.status === 'active' ? '#155724' : '#856404',
                    }}>
                      {p.status === 'active' ? '有効' : '仮登録'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(p)} style={btnSm('#555')}>編集</button>
                    {p.active_flag && (
                      <button onClick={() => remove(p.id, p.name)} style={{ ...btnSm('#c00'), marginLeft: 6 }}>無効化</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#888' }}>商品がありません</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

const btn   = (bg: string): React.CSSProperties => ({ padding: '8px 18px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 })
const btnSm = (bg: string): React.CSSProperties => ({ padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 })
