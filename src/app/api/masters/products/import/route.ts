// POST /api/masters/products/import
//
// Excel import for product master.
// Accepts multipart/form-data with "file" field.
// Column A: 品名 (required)
// Column B: 単価 (optional, numeric)
//
// Existing product (same name, case-insensitive) → update unit_price
// New product → create (active if price set, provisional if not)
//
// Returns: { created, updated, skipped, errors }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'
import ExcelJS from 'exceljs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file field required' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const wb = new ExcelJS.Workbook()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as unknown as any)
  const ws = wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: 'シートが見つかりません' }, { status: 422 })

  const rows: { name: string; unit_price: number | null }[] = []
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return // skip header
    const name = String(row.getCell(1).value ?? '').trim()
    if (!name) return
    const rawPrice = row.getCell(2).value
    const parsed = rawPrice !== null && rawPrice !== '' && rawPrice !== undefined
      ? Number(rawPrice) : null
    rows.push({ name, unit_price: parsed !== null && !isNaN(parsed) ? parsed : null })
  })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'データ行が見つかりません' }, { status: 422 })
  }

  // Fetch existing products for name matching
  type ExistingProduct = { id: string; name: string; unit_price: number | null; status: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('products')
    .select('id, name, unit_price, status')
    .eq('tenant_id', tenantId)

  const existingMap = new Map<string, ExistingProduct>(
    ((existing ?? []) as ExistingProduct[]).map(p => [p.name.toLowerCase(), p])
  )

  let created = 0, updated = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      const key = row.name.toLowerCase()
      const found = existingMap.get(key)

      if (found) {
        if (row.unit_price !== null && found.unit_price !== row.unit_price) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: upErr } = await (supabase as any)
            .from('products')
            .update({ unit_price: row.unit_price, status: 'active', active_flag: true })
            .eq('id', found.id)
            .eq('tenant_id', tenantId)

          if (upErr) { errors.push(`${row.name}: ${upErr.message}`); continue }
          updated++
        } else {
          skipped++
        }
      } else {
        const status = row.unit_price !== null ? 'active' : 'provisional'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insErr } = await (supabase as any)
          .from('products')
          .insert({
            tenant_id:   tenantId,
            name:        row.name,
            unit_price:  row.unit_price,
            tax_rate:    0.1,
            status,
            active_flag: status === 'active',
          })

        if (insErr) { errors.push(`${row.name}: ${insErr.message}`); continue }
        created++
      }
    } catch {
      errors.push(`${row.name}: unexpected error`)
    }
  }

  return NextResponse.json({ created, updated, skipped, errors })
}
