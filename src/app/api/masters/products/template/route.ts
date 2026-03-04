// GET /api/masters/products/template
// Returns a downloadable .xlsx template for product import

import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('商品')

  // Header row
  ws.addRow(['品名（規格込み）', '単価'])

  // Example rows
  ws.addRow(['鉄筋D10', 1500])
  ws.addRow(['鉄筋D13', 2200])
  ws.addRow(['単管パイプ3m', 800])
  ws.addRow(['合板12mm', ''])  // empty = 仮登録

  // Style header
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } }
  ws.columns = [
    { width: 28 },
    { width: 14 },
  ]

  // Notes row
  ws.addRow([])
  ws.addRow(['※ 1行目はヘッダー行です。削除しないでください。'])
  ws.addRow(['※ 単価を空白にすると「仮登録（単価未設定）」になります。'])
  ws.addRow(['※ 品名が同じ場合は上書き更新されます。'])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await wb.xlsx.writeBuffer() as any

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename*=UTF-8\'\'%E5%95%86%E5%93%81%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88.xlsx',
    },
  })
}
