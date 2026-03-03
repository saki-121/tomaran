// GET /api/invoices/[id]/preview
//
// Generates an Excel preview for a draft or confirmed invoice.
// Layout: 横A4, totals on page 1, items grouped by site.
// File name: YYYY-MM_会社名_INV-番号.xlsx

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/get-tenant'
import ExcelJS from 'exceljs'

type Ctx = { params: Promise<{ id: string }> }

type InvRow = {
  id: string
  invoice_number: string | null
  status: string
  closing_date: string | null
  payment_due_date: string | null
  period_from: string | null
  period_to: string | null
  total_amount: number | null
  tax_amount: number | null
  grand_total: number | null
  company: { id: string; name: string; address: string | null; invoice_number: string | null } | null
}

type OwnRow = {
  company_name: string | null
  address: string | null
  phone: string | null
  invoice_registration_number: string | null
}

type BankRow = {
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
}

type ItemRow = {
  site_name: string
  delivery_date: string
  product_name: string
  quantity: number
  unit_price: number
  tax_amount: number
  amount: number
}

function sanitizeFilename(s: string, maxLen = 100): string {
  return s.replace(/[/\\?*[\]:"|<>]/g, '').slice(0, maxLen)
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.replace(/-/g, '/')
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0'
  return n.toLocaleString('ja-JP')
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // ── Fetch invoice (cast any for join query) ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invQuery = await (supabase as any)
    .from('invoices')
    .select(`
      id, invoice_number, status,
      closing_date, payment_due_date,
      period_from, period_to,
      total_amount, tax_amount, grand_total,
      company:companies(id, name, address, invoice_number)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (invQuery.error || !invQuery.data) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }
  const inv = invQuery.data as InvRow

  // ── Fetch invoice items ────────────────────────────────────────────────────
  const { data: itemsData } = await supabase
    .from('invoice_items')
    .select('site_name, delivery_date, product_name, quantity, unit_price, tax_amount, amount')
    .eq('invoice_id', id)
    .eq('tenant_id', tenantId)
    .order('site_name')
    .order('delivery_date')
    .order('product_name')
  const items = (itemsData ?? []) as ItemRow[]

  // ── Fetch own company profile & default bank account ───────────────────────
  const [ownQuery, bankQuery] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('own_company_profiles')
      .select('company_name, address, phone, invoice_registration_number')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabase
      .from('bank_accounts')
      .select('bank_name, branch_name, account_type, account_number, account_holder')
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .maybeSingle(),
  ])

  const own  = (ownQuery.data  ?? null) as OwnRow  | null
  const bank = (bankQuery.data ?? null) as BankRow | null
  const company = inv.company

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('請求書', {
    pageSetup: {
      paperSize: 9,           // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    properties: { defaultColWidth: 14 },
  })

  ws.columns = [
    { width: 22 }, // A: ラベル/現場
    { width: 12 }, // B: 日付
    { width: 30 }, // C: 品名
    { width: 8  }, // D: 数量
    { width: 12 }, // E: 単価
    { width: 14 }, // F: 金額
  ]

  let rowNum = 1

  const bold:   Partial<ExcelJS.Style> = { font: { bold: true } }
  const right:  Partial<ExcelJS.Style> = { alignment: { horizontal: 'right' } }
  const center: Partial<ExcelJS.Style> = { alignment: { horizontal: 'center' } }
  const gray:   Partial<ExcelJS.Style> = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } } }
  const gold:   Partial<ExcelJS.Style> = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } } }
  const thin  = { style: 'thin' as const }
  const border: Partial<ExcelJS.Style> = { border: { top: thin, left: thin, bottom: thin, right: thin } }

  const isDraft = inv.status !== 'confirmed'

  // Helper to merge cells after adding content
  const merge = (r: number, c1: string, c2: string) => ws.mergeCells(`${c1}${r}:${c2}${r}`)

  // ── Title ─────────────────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = isDraft ? '請求書（プレビュー）' : '請求書'
    r.getCell(1).style = { font: { bold: true, size: 18 }, alignment: { horizontal: 'center' } }
    r.height = 32
    r.commit()
    merge(rowNum, 'A', 'F')
    rowNum++
  }

  // ── Issue info ────────────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = `発行日：${fmtDate(inv.closing_date)}`
    r.getCell(1).style = bold
    r.getCell(4).value = `請求番号：${inv.invoice_number ?? '（確定前）'}`
    r.getCell(4).style = bold
    r.commit()
    merge(rowNum, 'A', 'C')
    merge(rowNum, 'D', 'F')
    rowNum++
  }

  rowNum++ // blank

  // ── Recipient / Issuer ────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = `${company?.name ?? ''} 御中`
    r.getCell(1).style = { font: { bold: true, size: 13 } }
    r.getCell(4).value = own?.company_name ?? ''
    r.getCell(4).style = bold
    r.commit()
    merge(rowNum, 'A', 'C')
    merge(rowNum, 'D', 'F')
    rowNum++
  }

  // 請求先住所
  if (company?.address) {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = company.address
    r.commit()
    merge(rowNum, 'A', 'C')
    rowNum++
  }

  if (own?.invoice_registration_number) {
    const r = ws.getRow(rowNum)
    r.getCell(4).value = `適格登録番号：${own.invoice_registration_number}`
    r.commit()
    merge(rowNum, 'D', 'F')
    rowNum++
  }

  if (own?.address) {
    const r = ws.getRow(rowNum)
    r.getCell(4).value = own.address
    r.commit()
    merge(rowNum, 'D', 'F')
    rowNum++
  }

  rowNum++ // blank

  // ── Billing period ────────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = `ご請求期間：${fmtDate(inv.period_from)} ～ ${fmtDate(inv.period_to)}`
    r.commit()
    merge(rowNum, 'A', 'F')
    rowNum++
  }

  rowNum++ // blank

  // ── 請求文言 ──────────────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = '下記の通りご請求させていただきます。'
    r.commit()
    merge(rowNum, 'A', 'F')
    rowNum++
  }

  // ── Totals box (always page 1) ────────────────────────────────────────────
  {
    // Grand total header
    const r1 = ws.getRow(rowNum)
    r1.getCell(1).value = '【ご請求金額】'
    r1.getCell(1).style = { ...bold, ...gray, ...border }
    for (let i = 2; i <= 3; i++) r1.getCell(i).style = { ...gray, ...border }
    r1.getCell(4).value = '合計（税込）'
    r1.getCell(4).style = { ...gray, ...border, ...center }
    r1.getCell(5).style = { ...gray, ...border }
    r1.getCell(6).value = `¥ ${fmtNum(inv.grand_total)}`
    r1.getCell(6).style = { ...bold, ...border, ...right, ...gold, font: { bold: true, size: 14 } }
    r1.height = 24
    r1.commit()
    merge(rowNum, 'A', 'C')
    merge(rowNum, 'D', 'E')
    rowNum++
  }
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = '小計（税抜）'
    r.getCell(1).style = { ...bold, ...border }
    merge(rowNum, 'A', 'C')
    r.getCell(4).value = `¥ ${fmtNum(inv.total_amount)}`
    r.getCell(4).style = { ...bold, ...border, ...right }
    merge(rowNum, 'D', 'F')
    r.commit()
    rowNum++
  }
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = '消費税（10%）'
    r.getCell(1).style = { ...bold, ...border }
    merge(rowNum, 'A', 'C')
    r.getCell(4).value = `¥ ${fmtNum(inv.tax_amount)}`
    r.getCell(4).style = { ...bold, ...border, ...right }
    merge(rowNum, 'D', 'F')
    r.commit()
    rowNum++
  }
  {
    const r = ws.getRow(rowNum)
    r.getCell(1).value = `支払期限：${fmtDate(inv.payment_due_date)}`
    r.getCell(1).style = { ...bold, ...border }
    merge(rowNum, 'A', 'F')
    r.commit()
    rowNum++
  }

  rowNum++ // blank

  // ── 振込先 ────────────────────────────────────────────────────────────────
  if (bank) {
    {
      const r = ws.getRow(rowNum)
      r.getCell(1).value = '【振込先】'
      r.getCell(1).style = { ...bold, ...gray }
      r.commit()
      merge(rowNum, 'A', 'C')
      rowNum++
    }
    {
      const r = ws.getRow(rowNum)
      r.getCell(1).value = `${bank.bank_name} ${bank.branch_name}支店　${bank.account_type}`
      r.commit()
      merge(rowNum, 'A', 'C')
      rowNum++
    }
    {
      const r = ws.getRow(rowNum)
      r.getCell(1).value = `口座番号：${bank.account_number}　名義：${bank.account_holder}`
      r.commit()
      merge(rowNum, 'A', 'C')
      rowNum++
    }
    rowNum++ // blank after 振込先
  }

  // ── Item header ───────────────────────────────────────────────────────────
  {
    const r = ws.getRow(rowNum)
    ;['現場', '日付', '品名', '数量', '単価', '金額'].forEach((h, i) => {
      r.getCell(i + 1).value = h
      r.getCell(i + 1).style = { ...bold, ...gray, ...border, ...center }
    })
    r.commit()
    rowNum++
  }

  // ── Item rows grouped by site ─────────────────────────────────────────────
  const ROWS_PER_PAGE = 35
  let rowsOnPage = 0

  const siteMap = new Map<string, ItemRow[]>()
  for (const item of items) {
    const arr = siteMap.get(item.site_name) ?? []
    arr.push(item)
    siteMap.set(item.site_name, arr)
  }

  for (const [siteName, siteItems] of siteMap) {
    const needed = siteItems.length + 2 // header + items + subtotal
    if (rowsOnPage > 0 && rowsOnPage + needed > ROWS_PER_PAGE) {
      ws.getRow(rowNum).addPageBreak()
      rowsOnPage = 0
    }

    // Site header
    {
      const r = ws.getRow(rowNum)
      r.getCell(1).value = `■ ${siteName}`
      r.getCell(1).style = {
        ...bold,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
        border: { bottom: thin },
      }
      for (let i = 2; i <= 6; i++) {
        r.getCell(i).style = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
          border: { bottom: thin },
        }
      }
      r.commit()
      merge(rowNum, 'A', 'F')
      rowNum++
      rowsOnPage++
    }

    let siteSubtotal = 0
    for (const item of siteItems) {
      const r = ws.getRow(rowNum)
      r.getCell(2).value = fmtDate(item.delivery_date)
      r.getCell(3).value = item.product_name
      r.getCell(4).value = item.quantity
      r.getCell(4).style = right
      r.getCell(5).value = item.unit_price
      r.getCell(5).style = { ...right, numFmt: '#,##0' }
      r.getCell(6).value = item.amount
      r.getCell(6).style = { ...right, numFmt: '#,##0' }
      r.commit()
      rowNum++
      rowsOnPage++
      siteSubtotal += item.amount
    }

    // Site subtotal
    {
      const r = ws.getRow(rowNum)
      r.getCell(5).value = `${siteName} 小計`
      r.getCell(5).style = { ...right, ...bold, border: { top: thin } }
      r.getCell(6).value = siteSubtotal
      r.getCell(6).style = { ...right, ...bold, numFmt: '#,##0', border: { top: thin } }
      r.commit()
      rowNum++
      rowsOnPage++
    }

    rowNum++ // blank between sites
    rowsOnPage++
  }

  // ── Footer totals ─────────────────────────────────────────────────────────
  {
    const f1 = ws.getRow(rowNum)
    f1.getCell(5).value = '合計（税抜）'
    f1.getCell(5).style = { ...bold, ...right, ...border }
    f1.getCell(6).value = inv.total_amount ?? 0
    f1.getCell(6).style = { ...bold, ...right, numFmt: '#,##0', ...border }
    f1.commit(); rowNum++

    const f2 = ws.getRow(rowNum)
    f2.getCell(5).value = '消費税（10%）'
    f2.getCell(5).style = { ...bold, ...right, ...border }
    f2.getCell(6).value = inv.tax_amount ?? 0
    f2.getCell(6).style = { ...bold, ...right, numFmt: '#,##0', ...border }
    f2.commit(); rowNum++

    const f3 = ws.getRow(rowNum)
    f3.getCell(5).value = '合計（税込）'
    f3.getCell(5).style = { ...bold, ...right, ...border, ...gold }
    f3.getCell(6).value = inv.grand_total ?? 0
    f3.getCell(6).style = { ...bold, ...right, numFmt: '#,##0', ...border, ...gold }
    f3.commit()
  }

  // ── Build response ────────────────────────────────────────────────────────
  const ym      = (inv.closing_date ?? '').slice(0, 7)
  const cname   = sanitizeFilename(company?.name ?? 'company')
  const invNo   = sanitizeFilename(inv.invoice_number ?? 'DRAFT')
  const filename = encodeURIComponent(`${ym}_${cname}_INV-${invNo}.xlsx`)

  const arrayBuf = await wb.xlsx.writeBuffer()
  return new NextResponse(arrayBuf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    },
  })
}
