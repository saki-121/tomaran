'use client'

import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

type Company = { id: string; name: string }

type Props = {
  companies:        Company[]
  currentCompanyId: string
  currentStatus:    string
}

export default function DeliveryFilter({
  companies,
  currentCompanyId,
  currentStatus,
}: Props) {
  const router = useRouter()

  function update(key: 'company_id' | 'status', value: string) {
    const params = new URLSearchParams()
    if (key !== 'company_id' && currentCompanyId) params.set('company_id', currentCompanyId)
    if (key !== 'status'     && currentStatus)    params.set('status',     currentStatus)
    if (value) params.set(key, value)
    const qs = params.toString()
    router.push(`/deliveries${qs ? `?${qs}` : ''}`)
  }

  const isFiltering = !!(currentCompanyId || currentStatus)

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        {/* 取引先フィルタ */}
        <select
          value={currentCompanyId}
          onChange={e => update('company_id', e.target.value)}
          style={s.select}
          aria-label="取引先で絞り込み"
        >
          <option value="">すべての取引先</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* ステータスフィルタ */}
        <select
          value={currentStatus}
          onChange={e => update('status', e.target.value)}
          style={s.select}
          aria-label="ステータスで絞り込み"
        >
          <option value="">すべて</option>
          <option value="editable">編集可</option>
          <option value="invoiced">請求済</option>
        </select>
      </div>

      {/* フィルタ適用中のみクリアを表示 */}
      {isFiltering && (
        <button onClick={() => router.push('/deliveries')} style={s.clear}>
          × フィルタをクリア
        </button>
      )}
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  wrap: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    gap: 8,
  },
  select: {
    flex: 1,
    minWidth: 0,
    padding: '10px 8px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  clear: {
    alignSelf: 'flex-start',
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
    minHeight: 44,
  },
}
