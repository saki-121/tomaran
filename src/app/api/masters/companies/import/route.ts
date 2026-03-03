// POST /api/masters/companies/import
// Body: multipart/form-data, field "file" = xlsx
// Returns: { created, updated, skipped, errors }
//
// Excel columns (row 1 = header, skipped):
//   A: 会社名（必須）
//   B: 住所
//   C: 電話番号
//   D: 締め日（5/10/15/20/25/31/月末→99）
//   E: 支払条件（翌月末→next_month_end / 締め後30日→after_30_days）

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'
import ExcelJS from 'exceljs'

const CLOSING_MAP: Record<string, number> = {
  '月末': 99, '5': 5, '10': 10, '15': 15, '20': 20, '25': 25, '31': 31,
}

const PAYMENT_MAP: Record<string, string> = {
  '翌月末': 'next_month_end',
  '締め後30日': 'after_30_days',
}

function cellStr(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && 'text' in v) return String((v as { text: string }).text).trim()
  return String(v).trim()
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'fileが必要です' }, { status: 400 })
  }

  const arrayBuf = await (file as Blob).arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(new Uint8Array(arrayBuf) as any)
  } catch {
    return NextResponse.json({ error: 'Excelファイルの読み込みに失敗しました' }, { status: 400 })
  }

  const sheet = workbook.worksheets[0]
  if (!sheet) return NextResponse.json({ error: 'シートが見つかりません' }, { status: 400 })

  // Load existing companies for this tenant (for upsert logic)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchErr } = await (supabase as any)
    .from('companies')
    .select('id, name')
    .eq('tenant_id', tenantId)

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const existingMap = new Map<string, string>() // name.toLowerCase() → id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of (existing ?? []) as any[]) {
    existingMap.set(c.name.toLowerCase(), c.id)
  }

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  // Skip header row (row 1), process from row 2
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    const name = cellStr(row.getCell(1))
    if (!name) { skipped++; continue }

    const addressRaw  = cellStr(row.getCell(2))
    const phoneRaw    = cellStr(row.getCell(3))
    const closingRaw  = cellStr(row.getCell(4))
    const paymentRaw  = cellStr(row.getCell(5))

    const address      = addressRaw || null
    const phone        = phoneRaw || null
    const closing_day  = closingRaw ? (CLOSING_MAP[closingRaw] ?? (parseInt(closingRaw, 10) || 99)) : 99
    const payment_type = paymentRaw ? (PAYMENT_MAP[paymentRaw] ?? 'next_month_end') : 'next_month_end'

    const existingId = existingMap.get(name.toLowerCase())

    if (existingId) {
      // Update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upErr } = await (supabase as any)
        .from('companies')
        .update({ name, address, phone, closing_day, payment_type })
        .eq('id', existingId)
        .eq('tenant_id', tenantId)

      if (upErr) { errors.push(`行${rowNum} (${name}): ${upErr.message}`); continue }
      updated++
    } else {
      // Insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insErr } = await (supabase as any)
        .from('companies')
        .insert({ tenant_id: tenantId, name, address, phone, closing_day, payment_type })

      if (insErr) { errors.push(`行${rowNum} (${name}): ${insErr.message}`); continue }
      created++
    }
  }

  return NextResponse.json({ created, updated, skipped, errors })
}
