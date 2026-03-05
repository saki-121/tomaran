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

type OwnCompanyData = {
  profile: Profile | null
  logo_url: string | null
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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
      .then((d: OwnCompanyData) => {
        if (d.profile) setProfile(d.profile)
        if (d.logo_url) setLogoUrl(d.logo_url)
      })
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
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/masters/own/logo', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        setMsg(`エラー: ${data.error}`)
        return
      }

      setLogoUrl(data.logo_url)
      setMsg('ロゴを更新しました')
    } catch (error) {
      console.error('Logo upload error:', error)
      setMsg('アップロードに失敗しました')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('ロゴを削除しますか？')) return

    setUploadingLogo(true)
    setMsg(null)

    try {
      const res = await fetch('/api/masters/own/logo', {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        setMsg(`エラー: ${data.error}`)
        return
      }

      setLogoUrl(null)
      setMsg('ロゴを削除しました')
    } catch (error) {
      console.error('Logo delete error:', error)
      setMsg('削除に失敗しました')
    } finally {
      setUploadingLogo(false)
    }
  }

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
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13, color: '#9ca3af' }}>{label}</label>
      <input
        value={profile[key] ?? ''}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', background: '#1a2035', color: '#fff' }}
      />
    </div>
  )

  const bankInp = (label: string, key: keyof Omit<BankForm, 'is_default'>) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3, color: '#9ca3af' }}>{label}</label>
      <input
        type="text"
        value={bankForm[key] as string}
        onChange={e => setBankForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', background: '#1a2035', color: '#fff' }}
      />
    </div>
  )

  if (loadingProfile) return <p style={{ color: '#9ca3af' }}>読み込み中…</p>

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── 自社設定 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>自社設定</h2>
        
        {/* LINEお問い合わせリンク */}
        <div style={s.lineSupport}>
          <span style={s.lineText}>🤔 ご不明な点はLINEから</span>
          <a 
            href="https://lin.ee/2WeE9qB" 
            target="_blank" 
            rel="noopener noreferrer"
            style={s.lineButton}
          >
            💬 LINEで問い合わせ
          </a>
        </div>
      </div>
      <form onSubmit={saveProfile} style={{ maxWidth: 560, marginBottom: 48 }}>
        {/* ロゴアップロード */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13, color: '#9ca3af' }}>
            会社ロゴ
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            {logoUrl ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={logoUrl} 
                  alt="会社ロゴ" 
                  style={{ 
                    maxHeight: 80, 
                    maxWidth: 200, 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 6 
                  }} 
                />
                <button
                  type="button"
                  onClick={handleLogoDelete}
                  disabled={uploadingLogo}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{
                width: 200,
                height: 80,
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: 12,
              }}>
                ロゴ未設定
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              style={{
                display: 'none'
              }}
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              style={{
                padding: '8px 16px',
                background: uploadingLogo ? 'rgba(255,255,255,0.1)' : '#FFD700',
                color: uploadingLogo ? '#6b7280' : '#000',
                border: 'none',
                borderRadius: 6,
                cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {uploadingLogo ? 'アップロード中...' : 'ロゴを選択'}
            </label>
          </div>
          {msg && (
            <p style={{
              fontSize: 12,
              color: msg.includes('エラー') ? '#ef4444' : '#34d399',
              marginTop: 8,
              textAlign: 'center',
            }}>
              {msg}
            </p>
          )}
        </div>

        {profileField('会社名', 'company_name', '例：株式会社〇〇')}
        {profileField('住所', 'address', '例：東京都〇〇区…')}
        {profileField('電話番号', 'phone', '例：03-0000-0000')}
        {profileField('適格請求書登録番号', 'invoice_registration_number', '例：T1234567890123')}
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '10px 28px', background: '#FFD700', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 32 }} />

      {/* ── 銀行口座 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#fff' }}>銀行口座</h2>
        <button onClick={startNewBank} style={btnPrimary}>＋ 追加</button>
      </div>

      {bankEditing && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: '#fff' }}>{bankEditing === 'new' ? '新規口座' : '口座を編集'}</h3>
          {bankInp('銀行名 *', 'bank_name')}
          {bankInp('支店名', 'branch_name')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3, color: '#9ca3af' }}>口座種別</label>
            <select
              value={bankForm.account_type}
              onChange={e => setBankForm(f => ({ ...f, account_type: e.target.value }))}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, background: '#1a2035', color: '#fff' }}
            >
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          {bankInp('口座番号', 'account_number')}
          {bankInp('口座名義', 'account_holder')}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#d1d5db' }}>
              <input
                type="checkbox"
                checked={bankForm.is_default}
                onChange={e => setBankForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              デフォルトに設定（請求書に使用）
            </label>
          </div>
          {bankErr && <p style={{ color: '#ef4444', fontSize: 13, margin: '4px 0 8px' }}>{bankErr}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void saveBank()} disabled={bankSaving} style={btnPrimary}>{bankSaving ? '保存中…' : '保存'}</button>
            <button onClick={cancelBank} style={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {loadingBank ? <p style={{ fontSize: 14, color: '#9ca3af' }}>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>{accounts.length}件登録済み</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111827', borderRadius: 8, overflow: 'hidden', maxWidth: 800 }}>
            <thead>
              <tr style={{ background: '#1a2035' }}>
                {['銀行名', '支店', '種別', '口座番号', '名義', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>
                    {a.bank_name}
                    {a.is_default && (
                      <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', color: '#34d399', fontWeight: 600 }}>
                        デフォルト
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>{a.branch_name ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>{a.account_type ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>{a.account_number ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: '#d1d5db' }}>{a.account_holder ?? '—'}</td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEditBank(a)} style={btnSmall('#6b7280')}>編集</button>
                    {!a.is_default && (
                      <button onClick={() => void setDefaultBank(a)} style={{ ...btnSmall('#FFD700'), color: '#000', marginLeft: 6 }}>デフォルト</button>
                    )}
                    <button onClick={() => void removeBank(a.id, a.bank_name)} style={{ ...btnSmall('#ef4444'), marginLeft: 6 }}>削除</button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>口座が登録されていません</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties  = { padding: '8px 18px', background: '#FFD700', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', background: '#1a2035', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }
const btnSmall = (bg: string): React.CSSProperties => ({ padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 })

const s: Record<string, React.CSSProperties> = {
  lineSupport: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: 'rgba(0, 200, 0, 0.1)',
    border: '1px solid rgba(0, 200, 0, 0.3)',
    borderRadius: 6,
    marginLeft: 'auto',
  },
  lineText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
  },
  lineButton: {
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    background: '#00C300',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 4,
    whiteSpace: 'nowrap',
  },
}
