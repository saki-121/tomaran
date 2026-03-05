'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { withQueryTracking } from '@/lib/performance'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [editing, setEditing]   = useState<string | 'new' | null>(null)
  const [form, setForm]         = useState<FormData>(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [importing, setImporting]   = useState(false)
  const [importMsg, setImportMsg]   = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showFormat, setShowFormat] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
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

      await withQueryTracking('products-load', async () => {
        let query = supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name', { ascending: true })
        
        // Apply server-side search if query exists
        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery.trim()}%,spec.ilike.%${searchQuery.trim()}%`)
        }
        
        const { data } = await query
        setProducts(data ?? [])
      })
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    void load()
  }, [searchQuery, load]) // Reload when search query changes

  const filtered = products.filter(p => {
    // Filter by status (client-side for status filtering)
    if (filter === 'all') return true
    if (filter === 'active') return p.status === 'active'
    if (filter === 'provisional') return p.unit_price === null
    return true
  }).filter(p => {
    // Additional client-side search for safety
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return p.name.toLowerCase().includes(query) ||
           (p.spec && p.spec.toLowerCase().includes(query))
  })

  const startNew  = () => { setForm(emptyForm); setEditing('new'); setErr(null) }
  const startEdit = (p: Product) => { setForm(toForm(p)); setEditing(p.id); setErr(null) }
  const cancel    = () => { setEditing(null); setErr(null) }

  const save = async () => {
    if (!form.name.trim()) { setErr('名称は必須です'); return }
    setSaving(true); setErr(null)
    try {
      const supabase = await createClient()
      if (editing === 'new') {
        void supabase.from('products').insert({
          tenant_id: tenantId,
          name: form.name.trim(),
          spec: form.spec.trim() || null,
          unit_price: form.unit_price ? Number(form.unit_price) : null,
          tax_rate: Number(form.tax_rate),
          status: 'provisional',
          active_flag: true,
        }).then(() => {
          void load()
          cancel()
        })
      } else {
        void supabase.from('products').update({
          name: form.name.trim(),
          spec: form.spec.trim() || null,
          unit_price: form.unit_price ? Number(form.unit_price) : null,
          tax_rate: Number(form.tax_rate),
          updated_at: new Date().toISOString(),
        }).eq('id', editing).then(() => {
          void load()
          cancel()
        })
      }
    } catch (_error) {
      setErr('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string, n: string) => {
    if (!confirm(`「${n}」を無効化しますか？`)) return
    void fetch(`/api/masters/products/${id}`, { method: 'DELETE' }).then(() => {
      void load()
    })
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
    setImportMsg('⏳ Excelファイルを解析中...')
    
    // Small delay to show processing state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      const res = await fetch('/api/masters/products/import', { method: 'POST', body: fd })
      const d = await res.json()
      setImporting(false)
      setPendingFile(null)
      if (!res.ok) { setImportMsg(`エラー: ${d.error}`); return }
      setImportMsg(`✅ 完了: 新規 ${d.created}件、更新 ${d.updated}件、スキップ ${d.skipped}件${d.errors?.length ? `\n⚠️ エラー: ${d.errors.join(', ')}` : ''}`)
      void load()
    } catch (_error) {
      setImporting(false)
      setImportMsg('❌ 取り込みに失敗しました。ファイル形式を確認してください。')
    }
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
          placeholder="商品名・規格で検索"
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

        {/* Excel Import */}
        <button onClick={() => fileRef.current?.click()} disabled={importing || !!pendingFile} style={btnGreen}>
          📥 Excel取り込み
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          onClick={() => setShowFormat(f => !f)}
          style={{ ...btnSecondary, padding: '5px 12px', fontSize: 12 }}
        >
          {showFormat ? '✕ 閉じる' : '💡 取込Excelサンプルを見る'}
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
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#fff' }}>取込Excelのレイアウト</p>
            <a
              href="/api/masters/products/template"
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
                  {['A　品名（規格込み） *', 'B　単価'].map(h => (
                    <th key={h} style={xlColHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row 1: header (yellow) */}
                <tr>
                  <td style={xlRowNum}>1</td>
                  {['品名（規格込み）', '単価'].map((v, i) => (
                    <td key={i} style={{ ...xlCell, background: 'rgba(255,215,0,0.18)', color: '#FFD700', fontWeight: 700 }}>{v}</td>
                  ))}
                </tr>
                {/* Row 2 */}
                <tr>
                  <td style={xlRowNum}>2</td>
                  <td style={xlCell}>鉄筋D10</td>
                  <td style={xlCell}>1500</td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <td style={xlRowNum}>3</td>
                  <td style={xlCell}>単管パイプ3m</td>
                  <td style={{ ...xlCell, color: '#6b7280' }}>（省略可＝仮登録）</td>
                </tr>
                {/* Row 4 */}
                <tr>
                  <td style={xlRowNum}>4</td>
                  <td style={xlCell}>合板12mm</td>
                  <td style={xlCell}>2800</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af' }}>
            1行目はヘッダー行です。2行目からデータを入力してください。単価は省略すると「仮登録（単価未設定）」になります。
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>
            ⚠️ A列の品名が完全一致する場合は既存データを上書き更新します。
          </p>
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
const btnSmall = (bg: string): React.CSSProperties => ({ padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 })

// Excel preview styles
const xlRowNum: React.CSSProperties = { padding: '4px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: 11, background: '#0f1629', width: 28, minWidth: 28 }
const xlColHead: React.CSSProperties = { padding: '4px 10px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 11, background: '#0f1629', fontWeight: 600, whiteSpace: 'nowrap' }
const xlCell: React.CSSProperties = { padding: '5px 10px', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 12, background: '#111827' }
