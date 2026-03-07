'use client'

import { useEffect, useState } from 'react'

type Company = { id: string; name: string }
type Site    = { id: string; name: string; company_id: string; active_flag: boolean }

export default function SitesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites]         = useState<Site[]>([])
  const [companyId, setCompanyId] = useState('')
  const [editing, setEditing]     = useState<string | null>(null)
  const [name, setName]           = useState('')
  const [err, setErr]             = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(false)

  // Load companies
  useEffect(() => {
    void fetch('/api/masters/companies')
      .then(r => r.json())
      .then(d => {
        setCompanies(d.companies ?? [])
        if (d.companies?.length > 0) setCompanyId(d.companies[0].id)
      })
  }, [])

  // Load sites when company changes
  const loadSites = (cid: string) => {
    if (!cid) return
    setLoading(true)
    void fetch(`/api/masters/sites?company_id=${cid}&all=1`)
      .then(r => r.json())
      .then(d => setSites(d.sites ?? []))
      .finally(() => setLoading(false))
  }

  // Sites API currently filters active_flag=true; we call directly for all
  const loadAll = () => {
    if (!companyId) return
    setLoading(true)
    // Use all=1 param (not yet on sites route, falls back to active only)
    void fetch(`/api/masters/sites?company_id=${companyId}`)
      .then(r => r.json())
      .then(d => setSites(d.sites ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (companyId) loadSites(companyId) }, [companyId])

  const startNew  = () => { setName(''); setEditing('new'); setErr(null) }
  const startEdit = (s: Site) => { setName(s.name); setEditing(s.id); setErr(null) }
  const cancel    = () => { setEditing(null); setErr(null) }

  const save = async () => {
    if (!name.trim()) { setErr('名称は必須です'); return }
    setSaving(true); setErr(null)
    const url    = editing === 'new' ? '/api/masters/sites' : `/api/masters/sites/${editing}`
    const method = editing === 'new' ? 'POST' : 'PUT'
    const body   = editing === 'new' ? { name: name.trim(), company_id: companyId } : { name: name.trim() }
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d      = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(d.error); return }
    cancel()
    loadAll()
  }

  const remove = async (id: string, n: string) => {
    if (!confirm(`「${n}」を無効化しますか？`)) return
    await fetch(`/api/masters/sites/${id}`, { method: 'DELETE' })
    loadAll()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>現場マスタ</h2>
        <select
          value={companyId}
          onChange={e => setCompanyId(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
        >
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={startNew} disabled={!companyId} style={btn('#1a1a2e')}>＋ 新規追加</button>
      </div>

      {editing && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 400 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editing === 'new' ? '新規現場' : '現場を編集'}</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="現場名"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }}
          />
          {err && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={btn('#1a1a2e')}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={cancel} style={btn('#888')}>キャンセル</button>
          </div>
        </div>
      )}

      {loading ? <p>読み込み中…</p> : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['現場名', '状態', ''].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee', opacity: s.active_flag ? 1 : 0.5 }}>
                <td style={td}>{s.name}</td>
                <td style={td}>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: s.active_flag ? '#d4edda' : '#f8d7da', color: s.active_flag ? '#155724' : '#721c24' }}>
                    {s.active_flag ? '有効' : '無効'}
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <button onClick={() => startEdit(s)} style={btnSm('#555')}>編集</button>
                  {s.active_flag && (
                    <button onClick={() => remove(s.id, s.name)} style={{ ...btnSm('#c00'), marginLeft: 6 }}>無効化</button>
                  )}
                </td>
              </tr>
            ))}
            {sites.length === 0 && !loading && (
              <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#888' }}>現場がありません</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #ddd' }
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 }
const btn  = (bg: string): React.CSSProperties => ({ padding: '8px 18px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 })
const btnSm = (bg: string): React.CSSProperties => ({ padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 })
