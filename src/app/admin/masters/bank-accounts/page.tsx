'use client'

import { useEffect, useState } from 'react'

type BankAccount = {
  id: string
  bank_name: string
  branch_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
  is_default: boolean
}

type FormData = {
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
  is_default: boolean
}

const emptyForm: FormData = {
  bank_name: '', branch_name: '', account_type: '普通',
  account_number: '', account_holder: '', is_default: false,
}

function toForm(a: BankAccount): FormData {
  return {
    bank_name:      a.bank_name,
    branch_name:    a.branch_name    ?? '',
    account_type:   a.account_type   ?? '普通',
    account_number: a.account_number ?? '',
    account_holder: a.account_holder ?? '',
    is_default:     a.is_default,
  }
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [editing, setEditing]   = useState<string | null>(null)
  const [form, setForm]         = useState<FormData>(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  const load = () => {
    setLoading(true)
    void fetch('/api/masters/bank-accounts')
      .then(r => r.json())
      .then(d => setAccounts(d.bank_accounts ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const startNew  = () => { setForm(emptyForm); setEditing('new'); setErr(null) }
  const startEdit = (a: BankAccount) => { setForm(toForm(a)); setEditing(a.id); setErr(null) }
  const cancel    = () => { setEditing(null); setErr(null) }

  const save = async () => {
    if (!form.bank_name.trim()) { setErr('銀行名は必須です'); return }
    setSaving(true); setErr(null)
    const url    = editing === 'new' ? '/api/masters/bank-accounts' : `/api/masters/bank-accounts/${editing}`
    const method = editing === 'new' ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_name:      form.bank_name.trim(),
        branch_name:    form.branch_name.trim()    || null,
        account_type:   form.account_type          || null,
        account_number: form.account_number.trim() || null,
        account_holder: form.account_holder.trim() || null,
        is_default:     form.is_default,
      }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(d.error); return }
    cancel()
    load()
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await fetch(`/api/masters/bank-accounts/${id}`, { method: 'DELETE' })
    load()
  }

  const setDefault = async (id: string) => {
    const a = accounts.find(x => x.id === id)
    if (!a) return
    await fetch(`/api/masters/bank-accounts/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...toForm(a), is_default: true }),
    })
    load()
  }

  const inp = (label: string, key: keyof Omit<FormData, 'is_default'>) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{label}</label>
      <input
        type="text"
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>銀行口座マスタ</h2>
        <button onClick={startNew} style={btn('#1a1a2e')}>＋ 追加</button>
      </div>

      {editing && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>{editing === 'new' ? '新規口座' : '口座を編集'}</h3>
          {inp('銀行名 *', 'bank_name')}
          {inp('支店名', 'branch_name')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>口座種別</label>
            <select
              value={form.account_type}
              onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
            >
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          {inp('口座番号', 'account_number')}
          {inp('口座名義', 'account_holder')}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              デフォルトに設定
            </label>
          </div>
          {err && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void save()} disabled={saving} style={btn('#1a1a2e')}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={cancel} style={btn('#888')}>キャンセル</button>
          </div>
        </div>
      )}

      {loading ? <p>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{accounts.length}件</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                {['銀行名', '支店', '種別', '口座番号', '名義', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #ddd' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>
                    {a.bank_name}
                    {a.is_default && (
                      <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 7px', borderRadius: 10, background: '#d4edda', color: '#155724', fontWeight: 600 }}>
                        デフォルト
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{a.branch_name ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{a.account_type ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{a.account_number ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{a.account_holder ?? '—'}</td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(a)} style={btnSm('#555')}>編集</button>
                    {!a.is_default && (
                      <button onClick={() => void setDefault(a.id)} style={{ ...btnSm('#2563eb'), marginLeft: 6 }}>デフォルト</button>
                    )}
                    <button onClick={() => void remove(a.id, a.bank_name)} style={{ ...btnSm('#c00'), marginLeft: 6 }}>削除</button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#888' }}>口座が登録されていません</td></tr>
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
