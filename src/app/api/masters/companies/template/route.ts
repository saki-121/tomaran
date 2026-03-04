// GET /api/masters/companies/template
// Returns a downloadable .xlsx template for company import

import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('取引先')

  // Header row
  ws.addRow(['会社名', '住所', '電話番号', '締め日', '支払条件'])

  // Example rows
  ws.addRow(['○○建設株式会社', '東京都千代田区1-1-1', '03-1234-5678', '月末', '翌月末'])
  ws.addRow(['△△工業株式会社', '大阪府大阪市1-2-3', '06-9876-5432', '20', '締め後30日'])
  ws.addRow(['□□商事', '', '', '末', '翌月末'])

  // Style header
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } }
  ws.columns = [
    { width: 24 },
    { width: 28 },
    { width: 18 },
    { width: 14 },
    { width: 16 },
  ]

  // Notes row
  ws.addRow([])
  ws.addRow(['※ 1行目はヘッダー行です。削除しないでください。'])
  ws.addRow(['※ 締め日: 5/10/15/20/25/31/月末（省略時は月末）'])
  ws.addRow(['※ 支払条件: 翌月末 / 締め後30日（省略時は翌月末）'])
  ws.addRow(['※ 会社名が同じ場合は上書き更新されます。'])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await wb.xlsx.writeBuffer() as any

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename*=UTF-8\'\'%E5%8F%96%E5%BC%95%E5%85%88%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88.xlsx',
    },
  })
}
