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
  const [importing, setImporting]   = useState(false)
  const [importMsg, setImportMsg]   = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showFormat, setShowFormat] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    void fetch('/api/masters/products?all=1')
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setImportMsg(null)
    e.target.value = ''
  }

  const cancelImport = () => setPendingFile(null)

  const confirmImport = async () => {
    if (!pendingFile) return
    setImporting(true)
    setImportMsg(null)
    const fd = new FormData()
    fd.append('file', pendingFile)
    const res = await fetch('/api/masters/products/import', { method: 'POST', body: fd })
    const d   = await res.json()
    setImporting(false)
    setPendingFile(null)
    if (!res.ok) { setImportMsg(`エラー: ${d.error}`); return }
    setImportMsg(`完了: 新規 ${d.created}件、更新 ${d.updated}件、スキップ ${d.skipped}件${d.errors?.length ? `\nエラー: ${d.errors.join(', ')}` : ''}`)
    load()
  }

  const inp = (label: string, key: keyof FormData, type = 'text') => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3, color: '#9ca3af' }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '1' : undefined}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', background: '#1a2035', color: '#fff' }}
      />
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>商品マスタ</h2>
        <button onClick={startNew} style={btnPrimary}>＋ 新規追加</button>

        {/* Excel Import */}
        <button onClick={() => fileRef.current?.click()} disabled={importing || !!pendingFile} style={btnGreen}>
          📥 Excel取り込み
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          onClick={() => setShowFormat(f => !f)}
          style={{ ...btnSecondary, padding: '5px 12px', fontSize: 12 }}
        >
          {showFormat ? '✕ 閉じる' : '❓ フォーマット'}
        </button>

        {/* Filter */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['all', 'active', 'provisional'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', fontSize: 13,
              background: filter === f ? '#FFD700' : '#1a2035',
              color:      filter === f ? '#000' : '#9ca3af',
              fontWeight: filter === f ? 700 : 400,
            }}>
              {f === 'all' ? '全て' : f === 'active' ? '有効' : '単価未設定'}
            </button>
          ))}
        </div>
      </div>

      {pendingFile && (
        <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#d1d5db' }}>📄 <strong>{pendingFile.name}</strong> を取り込みますか？</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void confirmImport()} disabled={importing} style={btnGreen}>
              {importing ? '取り込み中…' : '取り込む'}
            </button>
            <button onClick={cancelImport} disabled={importing} style={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {importMsg && (
        <div style={{ background: importMsg.startsWith('エラー') ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', border: '1px solid', borderColor: importMsg.startsWith('エラー') ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, whiteSpace: 'pre-wrap', color: importMsg.startsWith('エラー') ? '#ef4444' : '#34d399' }}>
          {importMsg}
        </div>
      )}

      {/* Import format guide */}
      {showFormat && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#fff' }}>Excelフォーマット（.xlsx / .xls）</p>
          <p style={{ margin: '0 0 8px', color: '#9ca3af' }}>1行目はヘッダー行として読み飛ばします。2行目からデータを入力してください。</p>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#1a2035' }}>
                {['列', '項目', '必須', '例', '備考'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { col: 'A', label: '品名（規格込み）', required: true,  example: '鉄筋D10',  note: '同名は上書き更新' },
                { col: 'B', label: '単価',             required: false, example: '1500',     note: '省略可（仮登録になります）' },
              ].map(row => (
                <tr key={row.col} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600, textAlign: 'center', color: '#FFD700' }}>{row.col}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db' }}>{row.label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', color: row.required ? '#34d399' : '#6b7280' }}>{row.required ? '✓' : '—'}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>{row.example}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 440 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: '#fff' }}>{editing === 'new' ? '新規商品' : '商品を編集'}</h3>
          {inp('品名（規格込み） *', 'name')}
          {inp('単価（空白 = 仮登録）', 'unit_price', 'number')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3, color: '#9ca3af' }}>ステータス</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, background: '#1a2035', color: '#fff' }}>
              <option value="active">有効（請求対象）</option>
              <option value="provisional">仮登録（単価未設定）</option>
            </select>
          </div>
          {err && <p style={{ color: '#ef4444', fontSize: 13, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={cancel} style={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#9ca3af' }}>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            {filtered.length}件表示
            {filter !== 'all' && ` / 全${products.length}件`}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111827', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a2035' }}>
                {['品名', '単価（税抜）', 'ステータス', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: p.active_flag ? 1 : 0.5 }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>
                    {p.unit_price !== null
                      ? `¥${p.unit_price.toLocaleString('ja-JP')}`
                      : <span style={{ color: '#ef4444' }}>未設定</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 12, padding: '2px 8px', borderRadius: 10,
                      background: p.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(255,215,0,0.1)',
                      color:      p.status === 'active' ? '#34d399' : '#FFD700',
                      fontWeight: 600,
                    }}>
                      {p.status === 'active' ? '有効' : '仮登録'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(p)} style={btnSmall('#6b7280')}>編集</button>
                    {p.active_flag && (
                      <button onClick={() => remove(p.id, p.name)} style={{ ...btnSmall('#ef4444'), marginLeft: 6 }}>無効化</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>商品がありません</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties   = { padding: '8px 18px', background: '#FFD700', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const btnGreen: React.CSSProperties     = { padding: '8px 18px', background: '#34d399', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', background: '#1a2035', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }
const btnSmall = (bg: string): React.CSSProperties => ({ padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 })
