'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Company     = { id: string; name: string }
type Site        = { id: string; name: string }
type Product     = { id: string; name: string; unit_price: number }
type ComboOption = { id: string; label: string }

type ItemRow = {
  _key:           string
  product_id:     string
  quantity:       string
  addingProduct:  boolean
  newProductName: string
}

type Props = {
  initialCompanies: Company[]
  initialProducts:  Product[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 0
const nextKey = () => String(++_seq)

function getTodayJST() {
  const jstOffset = 9 * 60 * 60 * 1000
  return new Date(Date.now() + jstOffset).toISOString().split('T')[0]
}

async function postJSON(path: string, body: unknown) {
  return fetch(path, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function toOptions(list: { id: string; name: string }[]): ComboOption[] {
  return list.map(x => ({ id: x.id, label: x.name }))
}

function productToOptions(list: Product[]): ComboOption[] {
  return list.map(p => ({
    id:    p.id,
    label: p.name + (p.unit_price === 0 ? '（単価未設定）' : ''),
  }))
}

// ---------------------------------------------------------------------------
// ComboBox — 検索専用（入力モードのみ）
//
// ③ 1文字バグ修正の要点：
//   - onChange は setQuery のみ（確定処理なし）
//   - onPointerDown でブラータイマーをキャンセル（ドロップダウンを維持）
//   - onClick で選択確定（キーボードタップは click を発生させない）
//
// ② 選択確定・ロック・「変更」ボタンは親コンポーネントが管理
// ---------------------------------------------------------------------------

function ComboBox({
  options, placeholder, onChange, disabled, onAddNew,
}: {
  options:     ComboOption[]
  placeholder: string
  onChange:    (id: string) => void
  disabled?:   boolean
  onAddNew?:   (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)

  // ③ blur タイマーを ref で管理し、リストタップ時にキャンセルする
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : []

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function cancelBlur() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => { cancelBlur(); if (!disabled) setOpen(true) }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 200) }}
        // ③ onChange は query 更新のみ — 確定処理なし
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        style={{
          ...s.input,
          backgroundColor: disabled ? '#f3f4f6' : '#fff',
        }}
      />

      {/* query がある時だけドロップダウン表示 */}
      {open && query && (
        <ul style={cb.list}>
          {filtered.length > 0 ? (
            filtered.map(o => (
              <li
                key={o.id}
                onPointerDown={cancelBlur}      // blur を防いでドロップダウン維持
                onClick={() => select(o.id)}    // 意図的タップのみ確定（③ キーボードタップは click を発火しない）
                style={cb.item}
              >
                {o.label}
              </li>
            ))
          ) : (
            <>
              <li style={cb.empty}>該当なし</li>
              {onAddNew && (
                <li
                  onPointerDown={cancelBlur}
                  onClick={() => { onAddNew(query); setOpen(false); setQuery('') }}
                  style={cb.addNew}
                >
                  「{query}」を新規登録
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DeliveryForm
// ---------------------------------------------------------------------------

export default function DeliveryForm({ initialCompanies, initialProducts }: Props) {
  const router = useRouter()

  // ── form fields ──────────────────────────────────────────────────────────
  const [date,      setDate]      = useState(getTodayJST())
  const [companyId, setCompanyId] = useState('')
  const [siteId,    setSiteId]    = useState('')
  const [items,     setItems]     = useState<ItemRow[]>([
    { _key: nextKey(), product_id: '', quantity: '1', addingProduct: false, newProductName: '' },
  ])

  // ── master data ──────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [sites,     setSites]     = useState<Site[]>([])
  const [products,  setProducts]  = useState<Product[]>(initialProducts)

  // ── その場登録 state ─────────────────────────────────────────────────────
  const [addingCompany,  setAddingCompany]  = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [companyBusy,    setCompanyBusy]    = useState(false)

  const [addingSite,  setAddingSite]  = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [siteBusy,    setSiteBusy]    = useState(false)

  // ── loading / error ──────────────────────────────────────────────────────
  const [sitesLoading, setSitesLoading] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')

  // ── handlers ─────────────────────────────────────────────────────────────

  async function handleCompanyChange(id: string) {
    setCompanyId(id)
    setSiteId('')
    setSites([])
    setAddingSite(false)
    if (!id) return
    setSitesLoading(true)
    try {
      const res  = await fetch(`/api/masters/sites?company_id=${id}`)
      const json = await res.json()
      setSites(json.sites ?? [])
    } finally {
      setSitesLoading(false)
    }
  }

  async function handleAddCompany() {
    if (!newCompanyName.trim() || companyBusy) return
    setCompanyBusy(true)
    setError('')
    try {
      const res  = await postJSON('/api/masters/companies', { name: newCompanyName.trim() })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      const co = json.company as Company
      setCompanies(prev => [...prev, co].sort((a, b) => a.name.localeCompare(b.name, 'ja')))
      await handleCompanyChange(co.id)
      setNewCompanyName('')
      setAddingCompany(false)
    } finally {
      setCompanyBusy(false)
    }
  }

  async function handleAddSite() {
    if (!newSiteName.trim() || siteBusy) return
    setSiteBusy(true)
    setError('')
    try {
      const res  = await postJSON('/api/masters/sites', { name: newSiteName.trim(), company_id: companyId })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      const site = json.site as Site
      setSites(prev => [...prev, site].sort((a, b) => a.name.localeCompare(b.name, 'ja')))
      setSiteId(site.id)
      setNewSiteName('')
      setAddingSite(false)
    } finally {
      setSiteBusy(false)
    }
  }

  async function handleAddProduct(key: string) {
    const item = items.find(i => i._key === key)
    if (!item?.newProductName.trim()) return
    setError('')
    const res  = await postJSON('/api/masters/products', { name: item.newProductName.trim() })
    const json = await res.json()
    if (!res.ok) { setError(json.error); return }
    const prod = json.product as Product
    setProducts(prev => [...prev, prod].sort((a, b) => a.name.localeCompare(b.name, 'ja')))
    setItems(prev => prev.map(i => i._key !== key ? i : {
      ...i,
      product_id:     prod.id,
      addingProduct:  false,
      newProductName: '',
    }))
  }

  function addItemRow() {
    setItems(prev => [
      ...prev,
      { _key: nextKey(), product_id: '', quantity: '1', addingProduct: false, newProductName: '' },
    ])
  }

  function removeItemRow(key: string) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems(prev => prev.map(i => i._key !== key ? i : { ...i, ...patch }))
  }

  async function handleSubmit() {
    setError('')
    if (!date)      { setError('納品日を入力してください');   return }
    if (!companyId) { setError('取引先を選択してください'); return }
    if (!siteId)    { setError('現場を選択してください');   return }

    const validItems = items.filter(i => i.product_id && parseFloat(i.quantity) > 0)
    if (validItems.length === 0) { setError('商品を1件以上登録してください'); return }

    setSubmitting(true)
    try {
      const res  = await postJSON('/api/deliveries', {
        delivery_date: date,
        company_id:    companyId,
        site_id:       siteId,
        items:         validItems.map(i => ({
          product_id: i.product_id,
          quantity:   parseFloat(i.quantity),
        })),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '登録に失敗しました'); return }
      router.push(`/deliveries/${json.delivery.id}/complete`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  const selectedCompany = companies.find(c => c.id === companyId)
  const selectedSite    = sites.find(st => st.id === siteId)

  return (
    <main style={s.main}>

      {/* header */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.backBtn}>← 戻る</button>
        <h1 style={s.heading}>納品登録</h1>
      </div>

      {error && <p style={s.errorBox}>{error}</p>}

      {/* ── 納品日 ───────────────────────────────── */}
      <section style={s.card}>
        <label style={s.label}>納品日</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={s.input}
        />
      </section>

      {/* ── 取引先 ───────────────────────────────── */}
      <section style={s.card}>
        {/* ② label行に変更ボタン（タップ領域分離） */}
        <div style={s.labelRow}>
          <label style={s.label}>取引先</label>
          {companyId && (
            <button onPointerDown={() => handleCompanyChange('')} style={s.changeBtn}>
              変更
            </button>
          )}
        </div>

        {/* ② 選択済み → 表示のみ（クリック不可）/ 未選択 → 検索入力 */}
        {selectedCompany ? (
          <p style={s.selectedValue}>{selectedCompany.name}</p>
        ) : (
          <ComboBox
            options={toOptions(companies)}
            placeholder="取引先名を入力して検索"
            onChange={id => handleCompanyChange(id)}
            onAddNew={name => { setNewCompanyName(name); setAddingCompany(true) }}
          />
        )}

        {addingCompany && (
          <InlineAdd
            placeholder="取引先名を入力"
            value={newCompanyName}
            busy={companyBusy}
            onChange={setNewCompanyName}
            onAdd={handleAddCompany}
            onCancel={() => { setAddingCompany(false); setNewCompanyName('') }}
          />
        )}
      </section>

      {/* ── 現場（取引先選択後に表示） ───────────── */}
      {companyId && (
        <section style={s.card}>
          {/* ② label行に変更ボタン */}
          <div style={s.labelRow}>
            <label style={s.label}>現場</label>
            {siteId && (
              <button onPointerDown={() => setSiteId('')} style={s.changeBtn}>
                変更
              </button>
            )}
          </div>

          {sitesLoading ? (
            <p style={s.hint}>読み込み中…</p>
          ) : selectedSite ? (
            <p style={s.selectedValue}>{selectedSite.name}</p>
          ) : (
            <ComboBox
              options={toOptions(sites)}
              placeholder="現場名を入力して検索"
              onChange={setSiteId}
              onAddNew={name => { setNewSiteName(name); setAddingSite(true) }}
            />
          )}

          {addingSite && (
            <InlineAdd
              placeholder="現場名を入力"
              value={newSiteName}
              busy={siteBusy}
              onChange={setNewSiteName}
              onAdd={handleAddSite}
              onCancel={() => { setAddingSite(false); setNewSiteName('') }}
            />
          )}
        </section>
      )}

      {/* ── 商品 ─────────────────────────────────── */}
      <section style={s.card}>
        <label style={s.label}>商品</label>

        <div style={s.itemList}>
          {items.map((item, idx) => {
            const selectedProduct = productToOptions(products).find(p => p.id === item.product_id)
            return (
              <div key={item._key} style={s.itemBox}>

                {/* ② 商品N + 変更・削除ボタン（label行で分離） */}
                <div style={s.itemHeader}>
                  <span style={s.itemNum}>商品 {idx + 1}</span>
                  <div style={s.itemBtns}>
                    {item.product_id && (
                      <button
                        onPointerDown={() => updateItem(item._key, { product_id: '' })}
                        style={s.changeBtn}
                      >
                        変更
                      </button>
                    )}
                    {items.length > 1 && (
                      <button onClick={() => removeItemRow(item._key)} style={s.removeBtn}>
                        削除
                      </button>
                    )}
                  </div>
                </div>

                {/* ② 選択済み → 表示のみ / 未選択 → 検索入力 */}
                {selectedProduct ? (
                  <p style={s.selectedValue}>{selectedProduct.label}</p>
                ) : (
                  <ComboBox
                    options={productToOptions(products)}
                    placeholder="商品名を入力して検索"
                    onChange={id => updateItem(item._key, { product_id: id })}
                    onAddNew={name => updateItem(item._key, { newProductName: name, addingProduct: true })}
                  />
                )}

                {item.addingProduct && (
                  <InlineAdd
                    placeholder="商品名を入力"
                    value={item.newProductName}
                    busy={false}
                    onChange={v => updateItem(item._key, { newProductName: v })}
                    onAdd={() => handleAddProduct(item._key)}
                    onCancel={() => updateItem(item._key, { addingProduct: false, newProductName: '' })}
                  />
                )}

                {/* 数量 */}
                <div style={s.qtyRow}>
                  <span style={s.qtyLabel}>数量</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={e => updateItem(item._key, { quantity: e.target.value })}
                    style={s.qtyInput}
                    inputMode="numeric"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={addItemRow} style={s.addItemBtn}>
          ＋ 商品を追加
        </button>
      </section>

      {/* ── 登録ボタン ───────────────────────────── */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? '登録中…' : '登録する'}
      </button>
    </main>
  )
}

// ---------------------------------------------------------------------------
// InlineAdd — その場登録共通UI
// ---------------------------------------------------------------------------

function InlineAdd({
  placeholder, value, busy, onChange, onAdd, onCancel,
}: {
  placeholder: string
  value:       string
  busy:        boolean
  onChange:    (v: string) => void
  onAdd:       () => void
  onCancel:    () => void
}) {
  return (
    <div style={ia.wrap}>
      <input
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        style={{ ...ia.input, fontSize: 16 }}
      />
      <div style={ia.row}>
        <button
          onClick={onAdd}
          disabled={busy || !value.trim()}
          style={{ ...ia.btnAdd, opacity: busy || !value.trim() ? 0.5 : 1 }}
        >
          {busy ? '登録中…' : '追加'}
        </button>
        <button onClick={onCancel} style={ia.btnCancel}>
          キャンセル
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 448,
    margin: '0 auto',
    padding: '16px 16px 120px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#2563eb',
    cursor: 'pointer',
    padding: '8px 0',
    minHeight: 44,
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    margin: '0 0 12px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  // ② label行 + 変更ボタン（タップ領域分離）
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  // ② 選択確定後の表示専用テキスト（非インタラクティブ）
  selectedValue: {
    fontSize: 16,
    fontWeight: 500,
    color: '#111827',
    padding: '6px 0',
    margin: 0,
  },
  // ② 変更ボタン（label行右端）
  changeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#2563eb',
    cursor: 'pointer',
    padding: '4px 8px',
    minHeight: 44,
    flexShrink: 0,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
    boxSizing: 'border-box',
    minHeight: 44,
    color: '#111827',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    margin: 0,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  itemBox: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNum: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
  },
  itemBtns: {
    display: 'flex',
    gap: 4,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 8px',
    minHeight: 44,
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  qtyLabel: {
    fontSize: 13,
    color: '#374151',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  qtyInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
    minHeight: 44,
    boxSizing: 'border-box',
  },
  addItemBtn: {
    marginTop: 4,
    padding: '12px 0',
    width: '100%',
    background: '#fff',
    border: '1px dashed #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#2563eb',
    cursor: 'pointer',
    minHeight: 44,
  },
  submitBtn: {
    position: 'fixed',
    bottom: 24,
    left: 16,
    right: 16,
    padding: '16px 0',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 56,
  },
}

const cb: Record<string, CSSProperties> = {
  list: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    overflowY: 'auto',
    boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
    listStyle: 'none',
    padding: 0,
    margin: '4px 0 0',
  },
  item: {
    padding: '12px 14px',
    fontSize: 15,
    color: '#111827',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
  },
  empty: {
    padding: '12px 14px',
    fontSize: 14,
    color: '#9ca3af',
    listStyle: 'none',
  },
  addNew: {
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer',
    borderTop: '1px solid #e5e7eb',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    listStyle: 'none',
  },
}

const ia: Record<string, CSSProperties> = {
  wrap: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: 8,
  },
  btnAdd: {
    flex: 1,
    padding: '10px 0',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  btnCancel: {
    flex: 1,
    padding: '10px 0',
    background: '#fff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    minHeight: 44,
  },
}
