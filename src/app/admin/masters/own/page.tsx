'use client'

import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Profile = {
  company_name: string | null
  address: string | null
  phone: string | null
  invoice_registration_number: string | null
}

type BankAccount = {
  id: string
  bank_name: string
  branch_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
  is_default: boolean
}

type BankForm = {
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
  is_default: boolean
}

const emptyBank: BankForm = {
  bank_name: '', branch_name: '', account_type: '普通',
  account_number: '', account_holder: '', is_default: false,
}

function toBankForm(a: BankAccount): BankForm {
  return {
    bank_name:      a.bank_name,
    branch_name:    a.branch_name    ?? '',
    account_type:   a.account_type   ?? '普通',
    account_number: a.account_number ?? '',
    account_holder: a.account_holder ?? '',
    is_default:     a.is_default,
  }
}

const emptyProfile: Profile = { company_name: '', address: '', phone: '', invoice_registration_number: '' }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OwnMasterPage() {
  // ── 自社設定 ──
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<string | null>(null)

  // ── 銀行口座 ──
  const [accounts, setAccounts]     = useState<BankAccount[]>([])
  const [loadingBank, setLoadingBank] = useState(true)
  const [bankEditing, setBankEditing] = useState<string | null>(null)
  const [bankForm, setBankForm]       = useState<BankForm>(emptyBank)
  const [bankSaving, setBankSaving]   = useState(false)
  const [bankErr, setBankErr]         = useState<string | null>(null)

  // ── Initial loads ──
  useEffect(() => {
    void fetch('/api/masters/own')
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile(d.profile) })
      .finally(() => setLoadingProfile(false))
  }, [])

  const loadBanks = () => {
    setLoadingBank(true)
    void fetch('/api/masters/bank-accounts')
      .then(r => r.json())
      .then(d => setAccounts(d.bank_accounts ?? []))
      .finally(() => setLoadingBank(false))
  }
  useEffect(loadBanks, [])

  // ── 自社設定 save ──
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/masters/own', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const d = await res.json()
    if (!res.ok) { setMsg(`エラー: ${d.error}`); setSaving(false); return }
    setMsg('保存しました')
    setSaving(false)
  }

  // ── 銀行口座 CRUD ──
  const startNewBank  = () => { setBankForm(emptyBank); setBankEditing('new'); setBankErr(null) }
  const startEditBank = (a: BankAccount) => { setBankForm(toBankForm(a)); setBankEditing(a.id); setBankErr(null) }
  const cancelBank    = () => { setBankEditing(null); setBankErr(null) }

  const saveBank = async () => {
    if (!bankForm.bank_name.trim()) { setBankErr('銀行名は必須です'); return }
    setBankSaving(true); setBankErr(null)
    const url    = bankEditing === 'new' ? '/api/masters/bank-accounts' : `/api/masters/bank-accounts/${bankEditing}`
    const method = bankEditing === 'new' ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_name:      bankForm.bank_name.trim(),
        branch_name:    bankForm.branch_name.trim()    || null,
        account_type:   bankForm.account_type          || null,
        account_number: bankForm.account_number.trim() || null,
        account_holder: bankForm.account_holder.trim() || null,
        is_default:     bankForm.is_default,
      }),
    })
    const d = await res.json()
    setBankSaving(false)
    if (!res.ok) { setBankErr(d.error); return }
    cancelBank()
    loadBanks()
  }

  const removeBank = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await fetch(`/api/masters/bank-accounts/${id}`, { method: 'DELETE' })
    loadBanks()
  }

  const setDefaultBank = async (a: BankAccount) => {
    await fetch(`/api/masters/bank-accounts/${a.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...toBankForm(a), is_default: true }),
    })
    loadBanks()
  }

  // ── Render helpers ──
  const profileField = (label: string, key: keyof Profile, placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</label>
      <input
        value={profile[key] ?? ''}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )

  const bankInp = (label: string, key: keyof Omit<BankForm, 'is_default'>) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{label}</label>
      <input
        type="text"
        value={bankForm[key] as string}
        onChange={e => setBankForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )

  if (loadingProfile) return <p>読み込み中…</p>

  return (
    <div>
      {/* ── 自社設定 ──────────────────────────────────────────────── */}
      <h2 style={{ marginBottom: 24 }}>自社設定</h2>
      <form onSubmit={saveProfile} style={{ maxWidth: 560, marginBottom: 48 }}>
        {profileField('会社名', 'company_name', '例：株式会社〇〇')}
        {profileField('住所', 'address', '例：東京都〇〇区…')}
        {profileField('電話番号', 'phone', '例：03-0000-0000')}
        {profileField('適格請求書登録番号', 'invoice_registration_number', '例：T1234567890123')}
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '10px 28px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          {saving ? '保存中…' : '保存'}
        </button>
        {msg && <p style={{ marginTop: 12, color: msg.startsWith('エラー') ? 'red' : 'green', fontSize: 14 }}>{msg}</p>}
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: 32 }} />

      {/* ── 銀行口座 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>銀行口座</h2>
        <button onClick={startNewBank} style={btn('#1a1a2e')}>＋ 追加</button>
      </div>

      {bankEditing && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>{bankEditing === 'new' ? '新規口座' : '口座を編集'}</h3>
          {bankInp('銀行名 *', 'bank_name')}
          {bankInp('支店名', 'branch_name')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>口座種別</label>
            <select
              value={bankForm.account_type}
              onChange={e => setBankForm(f => ({ ...f, account_type: e.target.value }))}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
            >
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          {bankInp('口座番号', 'account_number')}
          {bankInp('口座名義', 'account_holder')}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bankForm.is_default}
                onChange={e => setBankForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              デフォルトに設定（請求書に使用）
            </label>
          </div>
          {bankErr && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 8px' }}>{bankErr}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void saveBank()} disabled={bankSaving} style={btn('#1a1a2e')}>{bankSaving ? '保存中…' : '保存'}</button>
            <button onClick={cancelBank} style={btn('#888')}>キャンセル</button>
          </div>
        </div>
      )}

      {loadingBank ? <p style={{ fontSize: 14, color: '#888' }}>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{accounts.length}件登録済み</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', maxWidth: 800 }}>
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
                    <button onClick={() => startEditBank(a)} style={btnSm('#555')}>編集</button>
                    {!a.is_default && (
                      <button onClick={() => void setDefaultBank(a)} style={{ ...btnSm('#2563eb'), marginLeft: 6 }}>デフォルト</button>
                    )}
                    <button onClick={() => void removeBank(a.id, a.bank_name)} style={{ ...btnSm('#c00'), marginLeft: 6 }}>削除</button>
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
