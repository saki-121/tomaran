'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { withQueryTracking } from '@/lib/performance'

type Company = {
  id: string
  name: string
  address: string | null
  phone: string | null
  closing_day: number
  payment_type: string
  active_flag: boolean
  created_at: string
}

type Site = {
  id: string
  name: string
  active_flag: boolean
}

type CompanyForm = {
  name: string
  address: string
  phone: string
  closing_day: string
  payment_type: string
}

type SiteForm = {
  name: string
}

const CLOSING_DAYS = [
  { value: '5',  label: '5日' },
  { value: '10', label: '10日' },
  { value: '15', label: '15日' },
  { value: '20', label: '20日' },
  { value: '25', label: '25日' },
  { value: '31', label: '31日' },
  { value: '99', label: '月末' },
]

const PAYMENT_TYPES = [
  { value: 'after_30_days',  label: '締め後30日' },
  { value: 'next_month_end', label: '翌月末' },
]

const emptyCompanyForm: CompanyForm = { name: '', address: '', phone: '', closing_day: '99', payment_type: 'next_month_end' }
const emptySiteForm: SiteForm = { name: '' }

function toCompanyForm(c: Company): CompanyForm {
  return { name: c.name, address: c.address ?? '', phone: c.phone ?? '', closing_day: String(c.closing_day), payment_type: c.payment_type }
}

function isNew(created_at: string): boolean {
  return Date.now() - new Date(created_at).getTime() < 7 * 24 * 60 * 60 * 1000
}

function closingLabel(day: number) {
  return day === 99 ? '月末' : `${day}日`
}

function paymentLabel(type: string) {
  return type === 'after_30_days' ? '締め後30日' : '翌月末'
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const th: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600,
  borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap', color: '#9ca3af',
}
const td: React.CSSProperties = { padding: '9px 12px', fontSize: 14, verticalAlign: 'middle', color: '#d1d5db' }
const tdSub: React.CSSProperties = { padding: '6px 12px', fontSize: 13, verticalAlign: 'middle', background: '#0f1629', color: '#9ca3af' }

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: '#FFD700', color: '#000', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700,
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 18px', background: '#1a2035', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, cursor: 'pointer', fontSize: 13,
}
const btnSmall = (bg: string): React.CSSProperties => ({
  padding: '3px 9px', background: bg, color: bg === '#FFD700' ? '#000' : '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 12,
})
const badgeNew: React.CSSProperties = {
  marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#000',
  background: '#FFD700', padding: '1px 5px', borderRadius: 3, verticalAlign: 'middle',
}
const badgeReady: React.CSSProperties = {
  marginLeft: 6, fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.1)',
  padding: '1px 5px', borderRadius: 3,
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [companies, setCompanies]   = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [sites, setSites]           = useState<Record<string, Site[]>>({})
  const [sitesLoading, setSitesLoading] = useState<Record<string, boolean>>({})

  // Company edit state
  const [editingCo, setEditingCo]   = useState<string | null>(null) // 'new' | id
  const [coForm, setCoForm]         = useState<CompanyForm>(emptyCompanyForm)
  const [coErr, setCoErr]           = useState<string | null>(null)
  const [coSaving, setCoSaving]     = useState(false)

  // Site edit state
  const [editingSite, setEditingSite] = useState<string | null>(null) // 'new-<companyId>' | siteId
  const [siteForm, setSiteForm]       = useState<SiteForm>(emptySiteForm)
  const [siteErr, setSiteErr]         = useState<string | null>(null)
  const [siteSaving, setSiteSaving]   = useState(false)

  // Import state
  const [importing, setImporting]   = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showFormat, setShowFormat] = useState(false)

  const loadCompanies = useCallback(() => {
    void (async () => {
      setLoading(true)
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get tenant_id
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single()
        
        if (!userTenant) return
        const tenantId = userTenant.tenant_id

        await withQueryTracking('companies-load', async () => {
          let query = supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
          
          // Apply server-side search if query exists
          if (searchQuery.trim()) {
            query = query.ilike('name', `%${searchQuery.trim()}%`)
          }
          
          const { data } = await query
          setCompanies(data ?? [])
        })
      } catch (_error) {
        console.error('Failed to load companies')
      } finally {
        setLoading(false)
      }
    })()
  }, [searchQuery])

  useEffect(() => {
    void loadCompanies()
  }, [searchQuery, loadCompanies]) // Reload when search query changes

  // Filter companies by search query (now only for address/phone search)
  const filteredCompanies = companies.filter(c => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    // Name search is handled server-side, but address/phone still client-side
    return (c.address && c.address.toLowerCase().includes(query)) ||
           (c.phone && c.phone.toLowerCase().includes(query))
  })

  // ── Toggle company expand ──────────────────────────────────────────────────
  const toggleExpand = async (companyId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(companyId)) { next.delete(companyId); return next }
      next.add(companyId)
      return next
    })
    if (!sites[companyId]) {
      setSitesLoading(p => ({ ...p, [companyId]: true }))
      const res = await fetch(`/api/masters/sites?company_id=${companyId}&all=1`)
      const d = await res.json()
      setSites(p => ({ ...p, [companyId]: d.sites ?? [] }))
      setSitesLoading(p => ({ ...p, [companyId]: false }))
    }
  }

  const reloadSites = async (companyId: string) => {
    const res = await fetch(`/api/masters/sites?company_id=${companyId}&all=1`)
    const d = await res.json()
    setSites(p => ({ ...p, [companyId]: d.sites ?? [] }))
  }

  // ── Company CRUD ────────────────────────────────────────────────────────────
  const startNewCo = () => { setCoForm(emptyCompanyForm); setEditingCo('new'); setCoErr(null) }
  const startEditCo = (c: Company, e: React.MouseEvent) => {
    e.stopPropagation()
    setCoForm(toCompanyForm(c)); setEditingCo(c.id); setCoErr(null)
  }
  const cancelCo = () => { setEditingCo(null); setCoErr(null) }

  const saveCo = async () => {
    if (!coForm.name.trim()) { setCoErr('名称は必須です'); return }
    setCoSaving(true); setCoErr(null)
    const url    = editingCo === 'new' ? '/api/masters/companies' : `/api/masters/companies/${editingCo}`
    const method = editingCo === 'new' ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...coForm, closing_day: Number(coForm.closing_day) }),
    })
    const d = await res.json()
    setCoSaving(false)
    if (!res.ok) { setCoErr(d.error); return }
    cancelCo()
    loadCompanies()
  }

  const deactivateCo = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`「${name}」を無効化しますか？`)) return
    await fetch(`/api/masters/companies/${id}`, { method: 'DELETE' })
    loadCompanies()
  }

  // ── Site CRUD ───────────────────────────────────────────────────────────────
  const startNewSite = (companyId: string) => {
    setSiteForm(emptySiteForm); setEditingSite(`new-${companyId}`); setSiteErr(null)
  }
  const startEditSite = (s: Site) => {
    setSiteForm({ name: s.name }); setEditingSite(s.id); setSiteErr(null)
  }
  const cancelSite = () => { setEditingSite(null); setSiteErr(null) }

  const saveSite = async (companyId: string) => {
    if (!siteForm.name.trim()) { setSiteErr('名称は必須です'); return }
    setSiteSaving(true); setSiteErr(null)
    const isNew_ = editingSite?.startsWith('new-')
    const url    = isNew_ ? '/api/masters/sites' : `/api/masters/sites/${editingSite}`
    const method = isNew_ ? 'POST' : 'PUT'
    const body   = isNew_ ? { name: siteForm.name, company_id: companyId } : { name: siteForm.name }
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setSiteSaving(false)
    if (!res.ok) { setSiteErr(d.error); return }
    cancelSite()
    void reloadSites(companyId)
  }

  const deactivateSite = async (siteId: string, siteName: string, companyId: string) => {
    if (!confirm(`「${siteName}」を無効化しますか？`)) return
    await fetch(`/api/masters/sites/${siteId}`, { method: 'DELETE' })
    void reloadSites(companyId)
  }

  // ── Excel import ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setImportResult(null)
    e.target.value = ''
  }

  const cancelImport = () => setPendingFile(null)

  const confirmImport = async () => {
    if (!pendingFile) return
    setImporting(true)
    setImportResult(null)
    
    // Show processing state immediately
    setImportResult({ created: 0, updated: 0, skipped: 0, errors: ['⏳ Excelファイルを解析中...'] })
    
    // Small delay to show processing state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      const res = await fetch('/api/masters/companies/import', { method: 'POST', body: fd })
      const d = await res.json()
      setImporting(false)
      setPendingFile(null)
      if (!res.ok) { setImportResult({ created: 0, updated: 0, skipped: 0, errors: [d.error] }); return }
      setImportResult(d)
      void loadCompanies()
    } catch (_error) {
      setImporting(false)
      setImportResult({ created: 0, updated: 0, skipped: 0, errors: ['❌ 取り込みに失敗しました。ファイル形式を確認してください。'] })
    }
  }

  // ── Company form ─────────────────────────────────────────────────────────────
  const coInp = (label: string, key: keyof CompanyForm) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2, color: '#9ca3af' }}>{label}</label>
      <input
        value={coForm[key]}
        onChange={e => setCoForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '6px 9px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', background: '#1a2035', color: '#fff' }}
      />
    </div>
  )
  const coSel = (label: string, key: keyof CompanyForm, opts: { value: string; label: string }[]) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2, color: '#9ca3af' }}>{label}</label>
      <select
        value={coForm[key]}
        onChange={e => setCoForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '6px 9px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 14, background: '#1a2035', color: '#fff' }}
      >
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>取引先マスタ</h2>
        <button onClick={startNewCo} style={btnPrimary}>＋ 新規追加</button>

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

        {/* Search */}
        <input
          type="text"
          placeholder="会社名・住所・電話で検索"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ 
            padding: '6px 12px', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 6, 
            fontSize: 14, 
            background: '#1a2035', 
            color: '#fff',
            width: 200,
            minWidth: 150
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing || !!pendingFile}
          style={btnGreen}
        >
          📥 Excel取り込み
        </button>
        <button
          onClick={() => setShowFormat(f => !f)}
          style={{ ...btnSecondary }}
        >
          {showFormat ? '✕ 閉じる' : '💡 取込Excelサンプルを見る'}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      {/* Pending file confirmation */}
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

      {/* Import result */}
      {importResult && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#d1d5db' }}>
          <strong>取り込み結果:</strong>
          {' '}新規 {importResult.created}件 / 更新 {importResult.updated}件 / スキップ {importResult.skipped}件
          {importResult.errors.length > 0 && (
            <ul style={{ color: '#ef4444', margin: '6px 0 0 0', paddingLeft: 20 }}>
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} style={{ marginTop: 8, ...btnSmall('#6b7280') }}>閉じる</button>
        </div>
      )}

      {/* Import format guide */}
      {showFormat && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#fff' }}>取込Excelのレイアウト</p>
            <a
              href="/api/masters/companies/template"
              download
              style={{ fontSize: 12, color: '#34d399', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}
            >
              📥 テンプレートをDL
            </a>
          </div>

          {/* Excel-like preview */}
          <div style={{ overflowX: 'auto', marginBottom: 10 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={xlRowNum}></th>
                  {['A　会社名 *', 'B　住所', 'C　電話番号', 'D　締め日', 'E　支払条件'].map(h => (
                    <th key={h} style={xlColHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row 1: header (yellow) */}
                <tr>
                  <td style={xlRowNum}>1</td>
                  {['会社名', '住所', '電話番号', '締め日', '支払条件'].map((v, i) => (
                    <td key={i} style={{ ...xlCell, background: 'rgba(255,215,0,0.18)', color: '#FFD700', fontWeight: 700 }}>{v}</td>
                  ))}
                </tr>
                {/* Row 2 */}
                <tr>
                  <td style={xlRowNum}>2</td>
                  <td style={xlCell}>○○建設株式会社</td>
                  <td style={xlCell}>東京都千代田区1-1</td>
                  <td style={xlCell}>03-1234-5678</td>
                  <td style={xlCell}>月末</td>
                  <td style={xlCell}>翌月末</td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <td style={xlRowNum}>3</td>
                  <td style={xlCell}>△△工業有限会社</td>
                  <td style={{ ...xlCell, color: '#6b7280' }}>（省略可）</td>
                  <td style={xlCell}>06-9876-5432</td>
                  <td style={xlCell}>20</td>
                  <td style={xlCell}>締め後30日</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af' }}>
            1行目はヘッダー行です。2行目からデータを入力してください。
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>
            ⚠️ A列の会社名が完全一致する場合は既存データを上書き更新します。
            「○○建設」と「○○建設株式会社」は<strong>別会社</strong>として登録されます。
          </p>
        </div>
      )}

      {/* Company form (new/edit) */}
      {editingCo && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 20, marginBottom: 20, maxWidth: 520 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: '#fff' }}>{editingCo === 'new' ? '新規取引先' : '取引先を編集'}</h3>
          {coInp('会社名 *', 'name')}
          {coInp('住所', 'address')}
          {coInp('電話番号', 'phone')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {coSel('締め日 *', 'closing_day', CLOSING_DAYS)}
            {coSel('支払条件 *', 'payment_type', PAYMENT_TYPES)}
          </div>
          {coErr && <p style={{ color: '#ef4444', fontSize: 13, margin: '6px 0' }}>{coErr}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={saveCo} disabled={coSaving} style={btnPrimary}>{coSaving ? '保存中…' : '保存'}</button>
            <button onClick={cancelCo} style={btnSecondary}>キャンセル</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <p style={{ color: '#9ca3af' }}>読み込み中…</p> : (
        <>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            {filteredCompanies.length}件表示
            {searchQuery.trim() && ` / 全${companies.length}件`}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111827', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a2035' }}>
                {['', '会社名', '住所', '締め日', '支払条件', '状態', ''].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>取引先がありません</td></tr>
              )}
              {filteredCompanies.map(c => {
                const isExpanded = expanded.has(c.id)
                const companySites = sites[c.id] ?? []
                const loadingSites = sitesLoading[c.id] ?? false
                const editingThisSite = editingSite
                const isAddingNewSite = editingThisSite === `new-${c.id}`

                return (
                  <>
                    {/* Company row */}
                    <tr
                      key={c.id}
                      onClick={() => toggleExpand(c.id)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: c.active_flag ? 1 : 0.5, cursor: 'pointer', background: isExpanded ? 'rgba(255,215,0,0.03)' : undefined }}
                    >
                      <td style={{ ...td, width: 28, color: '#FFD700', fontSize: 13 }}>{isExpanded ? '▼' : '▶'}</td>
                      <td style={td}>
                        {c.name}
                        {isNew(c.created_at) && <span style={badgeNew}>NEW</span>}
                        {(!c.closing_day || !c.payment_type) && <span style={badgeReady}>請求設定未完</span>}
                      </td>
                      <td style={td}>{c.address ?? '—'}</td>
                      <td style={td}>{closingLabel(c.closing_day)}</td>
                      <td style={td}>{paymentLabel(c.payment_type)}</td>
                      <td style={td}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: c.active_flag ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: c.active_flag ? '#34d399' : '#ef4444', fontWeight: 600 }}>
                          {c.active_flag ? '有効' : '無効'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <button onClick={e => startEditCo(c, e)} style={btnSmall('#6b7280')}>編集</button>
                        {c.active_flag && (
                          <button onClick={e => deactivateCo(c.id, c.name, e)} style={{ ...btnSmall('#ef4444'), marginLeft: 6 }}>無効化</button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded site rows */}
                    {isExpanded && (
                      <>
                        {loadingSites && (
                          <tr key={`${c.id}-loading`}>
                            <td colSpan={7} style={{ ...tdSub, paddingLeft: 40, color: '#6b7280' }}>読み込み中…</td>
                          </tr>
                        )}
                        {!loadingSites && companySites.map(s => {
                          const isEditingThis = editingThisSite === s.id
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: s.active_flag ? 1 : 0.5 }}>
                              <td style={tdSub} />
                              <td colSpan={4} style={{ ...tdSub, paddingLeft: 32 }}>
                                {isEditingThis ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input
                                      value={siteForm.name}
                                      onChange={e => setSiteForm({ name: e.target.value })}
                                      style={{ padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 13, width: 220, background: '#1a2035', color: '#fff' }}
                                      autoFocus
                                    />
                                    <button onClick={() => saveSite(c.id)} disabled={siteSaving} style={btnSmall('#FFD700')}>{siteSaving ? '…' : '保存'}</button>
                                    <button onClick={cancelSite} style={btnSmall('#6b7280')}>取消</button>
                                    {siteErr && <span style={{ color: '#ef4444', fontSize: 12 }}>{siteErr}</span>}
                                  </div>
                                ) : (
                                  <span style={{ color: '#9ca3af' }}>└ {s.name}</span>
                                )}
                              </td>
                              <td style={tdSub}>
                                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: s.active_flag ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: s.active_flag ? '#34d399' : '#ef4444', fontWeight: 600 }}>
                                  {s.active_flag ? '有効' : '無効'}
                                </span>
                              </td>
                              <td style={{ ...tdSub, whiteSpace: 'nowrap' }}>
                                {!isEditingThis && (
                                  <>
                                    <button onClick={() => startEditSite(s)} style={btnSmall('#6b7280')}>編集</button>
                                    {s.active_flag && (
                                      <button onClick={() => deactivateSite(s.id, s.name, c.id)} style={{ ...btnSmall('#ef4444'), marginLeft: 6 }}>無効化</button>
                                    )}
                                  </>
                                )}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Add new site row */}
                        {!loadingSites && (
                          <tr key={`${c.id}-add`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0f1629' }}>
                            <td style={tdSub} />
                            <td colSpan={5} style={{ ...tdSub, paddingLeft: 32 }}>
                              {isAddingNewSite ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    value={siteForm.name}
                                    onChange={e => setSiteForm({ name: e.target.value })}
                                    placeholder="現場名"
                                    style={{ padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 13, width: 220, background: '#1a2035', color: '#fff' }}
                                    autoFocus
                                  />
                                  <button onClick={() => saveSite(c.id)} disabled={siteSaving} style={btnSmall('#34d399')}>{siteSaving ? '…' : '追加'}</button>
                                  <button onClick={cancelSite} style={btnSmall('#6b7280')}>取消</button>
                                  {siteErr && <span style={{ color: '#ef4444', fontSize: 12 }}>{siteErr}</span>}
                                </div>
                              ) : (
                                <button
                                  onClick={() => startNewSite(c.id)}
                                  style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: '#9ca3af' }}
                                >
                                  ＋ 現場を追加
                                </button>
                              )}
                            </td>
                            <td style={tdSub} />
                          </tr>
                        )}
                      </>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
const btnGreen: React.CSSProperties = { padding: '8px 18px', background: '#34d399', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }

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

// Excel preview styles
const xlRowNum: React.CSSProperties = { padding: '4px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: 11, background: '#0f1629', width: 28, minWidth: 28 }
const xlColHead: React.CSSProperties = { padding: '4px 10px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 11, background: '#0f1629', fontWeight: 600, whiteSpace: 'nowrap' }
