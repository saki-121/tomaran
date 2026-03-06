'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Company     = { id: string; name: string }
type Site        = { id: string; name: string }
type Product     = { id: string; name: string; unit_price: number | null }
type ComboOption = { id: string; label: string }
type OwnCompany  = { company_name: string | null; phone: string | null; logo_url: string | null }

type ItemRow = {
  _key:         string
  product_id:   string   // '' = free-text product
  textName:     string   // non-empty when free-text product is confirmed
  quantity:     string
  // transient UI state for free-text entry
  enteringText: boolean
  newTextName:  string
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
    label: p.unit_price !== null ? p.name : p.name + '（単価未設定）',
  }))
}

function getUnitPrice(item: ItemRow, products: Product[]): number | null {
  if (item.product_id) {
    return products.find(p => p.id === item.product_id)?.unit_price ?? null
  }
  return null // free-text = 後日連絡
}

function getAmount(item: ItemRow, products: Product[]): number {
  const price = getUnitPrice(item, products)
  if (price === null) return 0
  const qty = parseFloat(item.quantity) || 0
  return price * qty
}

// ---------------------------------------------------------------------------
// ComboBox — 納品入力と同一
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
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        style={{ ...s.input, backgroundColor: disabled ? '#F0EDE8' : '#FFFFFF' }}
      />
      {open && query && (
        <ul style={cb.list}>
          {filtered.length > 0 ? (
            filtered.map(o => (
              <li
                key={o.id}
                onPointerDown={cancelBlur}
                onClick={() => select(o.id)}
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
                  「{query}」を見積に追加
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
// InlineAdd — 納品入力と同一
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
          {busy ? '追加中…' : '追加'}
        </button>
        <button onClick={onCancel} style={ia.btnCancel}>
          キャンセル
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// QuoteForm
// ---------------------------------------------------------------------------

export default function QuoteForm({ initialCompanies, initialProducts }: Props) {
  const router = useRouter()

  // ── form fields ──────────────────────────────────────────────────────────
  const [companyId, setCompanyId] = useState('')
  const [siteId,    setSiteId]    = useState('')
  const [items,     setItems]     = useState<ItemRow[]>([
    { _key: nextKey(), product_id: '', textName: '', quantity: '1', enteringText: false, newTextName: '' },
  ])

  // ── master data ──────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [sites,     setSites]     = useState<Site[]>([])
  const products = initialProducts
  const [ownCompany, setOwnCompany] = useState<OwnCompany | null>(null)

  // ── on-the-fly registration state ────────────────────────────────────────
  const [addingCompany,  setAddingCompany]  = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [companyBusy,    setCompanyBusy]    = useState(false)

  const [addingSite,  setAddingSite]  = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [siteBusy,    setSiteBusy]    = useState(false)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [sitesLoading, setSitesLoading] = useState(false)
  const [error,        setError]        = useState('')
  const [showPreview,  setShowPreview]  = useState(false)
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null)

  // ── load own company for print preview ───────────────────────────────────
  useEffect(() => {
    void fetch('/api/masters/own')
      .then(r => r.json())
      .then(d => {
        const data = d as { profile?: { company_name: string | null; phone: string | null }; logo_url?: string | null }
        if (data.profile) {
          setOwnCompany({ ...data.profile, logo_url: data.logo_url ?? null })
        } else {
          setOwnCompany(null)
        }
      })
  }, [])

  // ── derived values ───────────────────────────────────────────────────────
  const selectedCompany = companies.find(c => c.id === companyId)
  const selectedSite    = sites.find(st => st.id === siteId)

  const validItems = items.filter(i =>
    (i.product_id !== '' || i.textName !== '') && parseFloat(i.quantity) > 0
  )
  const subtotal   = validItems.reduce((s, item) => s + getAmount(item, products), 0)
  const tax        = Math.floor(subtotal * 0.1)
  const grandTotal = subtotal + tax
  const today      = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  // ── handlers (同一 as 納品入力) ──────────────────────────────────────────

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

  function addItemRow() {
    setItems(prev => [
      ...prev,
      { _key: nextKey(), product_id: '', textName: '', quantity: '1', enteringText: false, newTextName: '' },
    ])
  }

  function removeItemRow(key: string) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems(prev => prev.map(i => i._key !== key ? i : { ...i, ...patch }))
  }

  function confirmTextProduct(key: string) {
    const item = items.find(i => i._key === key)
    if (!item?.newTextName.trim()) return
    updateItem(key, { textName: item.newTextName.trim(), enteringText: false, newTextName: '' })
  }

  function handleShowPreview() {
    setError('')
    if (!companyId) { setError('会社名を選択してください'); return }
    if (!siteId)    { setError('現場名を選択してください'); return }
    if (validItems.length === 0) { setError('商品を1件以上追加してください'); return }
    setSavedQuoteId(null)
    setShowPreview(true)
  }

  async function handlePrint() {
    if (!savedQuoteId) {
      const res = await fetch('/api/quotes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient:   selectedCompany?.name ?? '',
          subtotal,
          tax_amount:  tax,
          grand_total: grandTotal,
          items_json:  validItems.map(item => ({
            product_id:      item.product_id || null,
            product_name:    item.product_id
              ? (products.find(p => p.id === item.product_id)?.name ?? '')
              : item.textName,
            quantity:        parseFloat(item.quantity),
            unit_price:      getUnitPrice(item, products) ?? 0,
            amount:          getAmount(item, products),
            is_text_product: !item.product_id,
          })),
          issued_date: new Date().toISOString().split('T')[0],
        }),
      })
      const data = await res.json() as { quote?: { id: string } }
      if (data.quote?.id) setSavedQuoteId(data.quote.id)
    }
    window.print()
  }

  // ── print preview ────────────────────────────────────────────────────────

  if (showPreview) {
    return (
      <>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; background: #fff; }
          }
        `}</style>

        <div
          className="no-print"
          style={{
            position: 'sticky', top: 0,
            background: '#FDFCFB',
            borderBottom: '1px solid #E5E0DA',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            zIndex: 10,
          }}
        >
          <button onClick={() => setShowPreview(false)} style={btnSecondaryStyle}>← 戻る</button>
          <button onClick={() => void handlePrint()} style={btnPrimaryStyle}>印刷 / PDF保存</button>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px', fontFamily: 'sans-serif', background: '#fff', color: '#000' }}>
          {ownCompany?.logo_url && (
            <div style={{ marginBottom: 12 }}>
              <img src={ownCompany.logo_url} alt="会社ロゴ" style={{ maxHeight: 56, maxWidth: 160, objectFit: 'contain' }} />
            </div>
          )}
          <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 4 }}>御見積書</h1>
          <p style={{ textAlign: 'right', color: '#555', marginTop: 0 }}>発行日: {today}</p>

          {ownCompany?.company_name && (
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <p style={{ fontWeight: 700, margin: 0 }}>{ownCompany.company_name}</p>
              {ownCompany.phone && (
                <p style={{ color: '#555', margin: 0, fontSize: 13 }}>TEL: {ownCompany.phone}</p>
              )}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
              {selectedCompany?.name ?? ''}御中
            </p>
            {selectedSite && (
              <p style={{ color: '#444', margin: '0 0 4px', fontSize: 14 }}>{selectedSite.name}</p>
            )}
            <p style={{ color: '#444', margin: 0 }}>下記の通りお見積り申し上げます。</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>品名</th>
                <th style={{ ...thStyle, width: 60, textAlign: 'center' }}>数量</th>
                <th style={{ ...thStyle, width: 90, textAlign: 'right' }}>単価</th>
                <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {validItems.map(item => {
                const name      = item.product_id ? (products.find(p => p.id === item.product_id)?.name ?? '') : item.textName
                const unitPrice = getUnitPrice(item, products)
                const amount    = getAmount(item, products)
                const qty       = parseFloat(item.quantity)
                return (
                  <tr key={item._key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{name}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{qty}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {unitPrice !== null ? `¥${unitPrice.toLocaleString('ja-JP')}` : '後日お返事します'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {unitPrice !== null ? `¥${amount.toLocaleString('ja-JP')}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
              合計（税抜き）　¥{subtotal.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
              消費税（10%）　¥{tax.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              税込合計　¥{grandTotal.toLocaleString('ja-JP')}
            </p>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 32 }}>有効期限：発行日より30日</p>

          {/* 作成ツール表記 */}
          <p style={{ marginTop: 24, fontSize: 8, color: '#d1d5db', textAlign: 'center', letterSpacing: '0.03em' }}>
            この見積書は tomaran.net で作成しました 🔍
          </p>
        </div>
      </>
    )
  }

  // ── main form ────────────────────────────────────────────────────────────

  return (
    <main style={s.main}>

      {/* header */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.backBtn}>← 戻る</button>
        <h1 style={s.heading}>見積書作成</h1>
      </div>

      {error && <p style={s.errorBox}>{error}</p>}

      {/* ── 会社名 ───────────────────────────────── */}
      <section style={s.card}>
        <div style={s.labelRow}>
          <label style={s.label}>会社名</label>
          {companyId && (
            <button onPointerDown={() => handleCompanyChange('')} style={s.changeBtn}>変更</button>
          )}
        </div>
        {selectedCompany ? (
          <p style={s.selectedValue}>{selectedCompany.name}</p>
        ) : (
          <ComboBox
            options={toOptions(companies)}
            placeholder="会社名を入力して検索"
            onChange={id => handleCompanyChange(id)}
            onAddNew={name => { setNewCompanyName(name); setAddingCompany(true) }}
          />
        )}
        {addingCompany && (
          <InlineAdd
            placeholder="会社名を入力"
            value={newCompanyName}
            busy={companyBusy}
            onChange={setNewCompanyName}
            onAdd={handleAddCompany}
            onCancel={() => { setAddingCompany(false); setNewCompanyName('') }}
          />
        )}
      </section>

      {/* ── 現場名（会社選択後） ──────────────────── */}
      {companyId && (
        <section style={s.card}>
          <div style={s.labelRow}>
            <label style={s.label}>現場名</label>
            {siteId && (
              <button onPointerDown={() => setSiteId('')} style={s.changeBtn}>変更</button>
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
            const masterProduct = item.product_id ? products.find(p => p.id === item.product_id) : null
            const isSelected    = item.product_id !== '' || item.textName !== ''
            const unitPrice     = getUnitPrice(item, products)
            const amount        = getAmount(item, products)

            return (
              <div key={item._key} style={s.itemBox}>

                {/* header row */}
                <div style={s.itemHeader}>
                  <span style={s.itemNum}>商品 {idx + 1}</span>
                  <div style={s.itemBtns}>
                    {isSelected && (
                      <button
                        onPointerDown={() => updateItem(item._key, { product_id: '', textName: '', enteringText: false, newTextName: '' })}
                        style={s.changeBtn}
                      >
                        変更
                      </button>
                    )}
                    {items.length > 1 && (
                      <button onClick={() => removeItemRow(item._key)} style={s.removeBtn}>削除</button>
                    )}
                  </div>
                </div>

                {/* product search / selected name */}
                {isSelected ? (
                  <p style={s.selectedValue}>{masterProduct?.name ?? item.textName}</p>
                ) : (
                  <ComboBox
                    options={productToOptions(products)}
                    placeholder="商品名を入力して検索"
                    onChange={id => updateItem(item._key, { product_id: id, textName: '', enteringText: false })}
                    onAddNew={name => updateItem(item._key, { newTextName: name, enteringText: true })}
                  />
                )}

                {/* free-text name entry */}
                {item.enteringText && (
                  <InlineAdd
                    placeholder="商品名を入力"
                    value={item.newTextName}
                    busy={false}
                    onChange={v => updateItem(item._key, { newTextName: v })}
                    onAdd={() => confirmTextProduct(item._key)}
                    onCancel={() => updateItem(item._key, { enteringText: false, newTextName: '' })}
                  />
                )}

                {/* quantity / unit price / amount */}
                {isSelected && !item.enteringText && (
                  <>
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
                    <div style={s.priceRow}>
                      <div style={s.priceCell}>
                        <span style={s.priceLabel}>単価</span>
                        <span style={s.priceValue}>
                          {unitPrice !== null
                            ? `¥${unitPrice.toLocaleString('ja-JP')}`
                            : <span style={{ color: '#888888', fontSize: 13 }}>後日連絡</span>}
                        </span>
                      </div>
                      <div style={s.priceCell}>
                        <span style={s.priceLabel}>金額</span>
                        <span style={{ ...s.priceValue, color: unitPrice !== null ? '#333333' : '#888888' }}>
                          {unitPrice !== null ? `¥${amount.toLocaleString('ja-JP')}` : '—'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={addItemRow} style={s.addItemBtn}>＋ 商品を追加</button>
      </section>

      {/* ── 合計 ─────────────────────────────────── */}
      {validItems.length > 0 && (
        <section style={{ ...s.card, background: '#F5F0EB' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#333333' }}>
              合計（税抜き）　¥{subtotal.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#777777', margin: '0 0 2px' }}>
              消費税（10%）　¥{tax.toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 13, color: '#777777', margin: 0 }}>
              税込合計　¥{grandTotal.toLocaleString('ja-JP')}
            </p>
          </div>
        </section>
      )}

      {/* ── 見積書を作るボタン ───────────────────── */}
      <button onClick={handleShowPreview} style={s.submitBtn}>
        見積書を作る →
      </button>

    </main>
  )
}

// ---------------------------------------------------------------------------
// Styles — 納品入力と同一 + 見積追加分
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 448,
    margin: '0 auto',
    padding: '16px 16px 120px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#FDFCFB',
    minHeight: '100dvh',
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: {
    background: 'none', border: 'none', fontSize: 14,
    color: '#A16207', cursor: 'pointer', padding: '8px 0', minHeight: 44,
  },
  heading: { fontSize: 18, fontWeight: 700, color: '#333333', margin: 0 },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    margin: '0 0 12px',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '2px 2px 0 #E5E0DA',
  },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: 600, color: '#777777' },
  selectedValue: { fontSize: 16, fontWeight: 500, color: '#333333', padding: '6px 0', margin: 0 },
  changeBtn: {
    background: 'none', border: 'none', fontSize: 13,
    color: '#A16207', cursor: 'pointer', padding: '4px 8px', minHeight: 44, flexShrink: 0,
  },
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #D0CAC3',
    borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
    minHeight: 44, color: '#333333', background: '#FFFFFF',
  },
  hint: { fontSize: 14, color: '#888888', margin: 0 },
  itemList: { display: 'flex', flexDirection: 'column', gap: 12 },
  itemBox: {
    border: '1px solid #E5E0DA',
    borderRadius: 8, padding: 12, backgroundColor: '#F5F0EB',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemNum: { fontSize: 12, fontWeight: 600, color: '#888888' },
  itemBtns: { display: 'flex', gap: 4 },
  removeBtn: {
    background: 'none', border: 'none', color: '#ef4444',
    fontSize: 13, cursor: 'pointer', padding: '4px 8px', minHeight: 44,
  },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 12 },
  qtyLabel: { fontSize: 13, color: '#777777', whiteSpace: 'nowrap', flexShrink: 0 },
  qtyInput: {
    flex: 1, padding: '10px 12px',
    border: '1px solid #D0CAC3',
    borderRadius: 8, fontSize: 16, minHeight: 44,
    boxSizing: 'border-box', background: '#FFFFFF', color: '#333333',
  },
  // 見積追加: 単価・金額行
  priceRow: {
    display: 'flex', gap: 12,
    borderTop: '1px solid #F0EDE8',
    paddingTop: 8,
  },
  priceCell: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  priceLabel: { fontSize: 11, color: '#888888' },
  priceValue: { fontSize: 15, fontWeight: 600, color: '#333333' },
  addItemBtn: {
    marginTop: 4, padding: '12px 0', width: '100%',
    background: 'transparent',
    border: '1px dashed #D0CAC3',
    borderRadius: 8, fontSize: 14, color: '#A16207', cursor: 'pointer', minHeight: 44,
  },
  submitBtn: {
    position: 'fixed', bottom: 24, left: 16, right: 16,
    padding: '16px 0', background: '#FFD700', color: '#000',
    border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', minHeight: 56,
  },
}

const cb: Record<string, CSSProperties> = {
  list: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    background: '#FFFFFF', border: '1px solid #D0CAC3',
    borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    listStyle: 'none', padding: 0, margin: '4px 0 0',
  },
  item: {
    padding: '12px 14px', fontSize: 15, color: '#555555', cursor: 'pointer',
    borderBottom: '1px solid #F0EDE8',
    minHeight: 44, display: 'flex', alignItems: 'center',
  },
  empty: { padding: '12px 14px', fontSize: 14, color: '#888888', listStyle: 'none' },
  addNew: {
    padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#A16207',
    cursor: 'pointer', borderTop: '1px solid #E5E0DA',
    minHeight: 44, display: 'flex', alignItems: 'center', listStyle: 'none',
  },
}

const ia: Record<string, CSSProperties> = {
  wrap: {
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
  },
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #D0CAC3',
    borderRadius: 8, fontSize: 16, boxSizing: 'border-box', background: '#FFFFFF', color: '#333333',
  },
  row: { display: 'flex', gap: 8 },
  btnAdd: {
    flex: 1, padding: '10px 0', background: '#FFD700', color: '#000',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
  },
  btnCancel: {
    flex: 1, padding: '10px 0', background: '#F0EDE8', color: '#777777',
    border: '1px solid #D0CAC3', borderRadius: 8, fontSize: 14, cursor: 'pointer', minHeight: 44,
  },
}

const thStyle: CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 13, fontWeight: 600,
  color: '#374151', borderBottom: '2px solid #e5e7eb',
}
const tdStyle: CSSProperties = { padding: '8px 10px', fontSize: 14, color: '#333333' }
const btnPrimaryStyle: CSSProperties = {
  padding: '10px 18px', fontSize: 15, fontWeight: 700,
  background: '#FFD700', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', minHeight: 44,
}
const btnSecondaryStyle: CSSProperties = {
  padding: '10px 14px', fontSize: 15, background: 'none', color: '#A16207',
  border: '1px solid #D0CAC3', borderRadius: 8, cursor: 'pointer', minHeight: 44,
}

