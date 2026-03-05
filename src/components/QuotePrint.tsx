import Image from 'next/image'
import type { CSSProperties } from 'react'

type QuoteItem = {
  id: string
  quantity: number
  product?: { name: string; spec: string | null } | null
  textProduct?: { name: string } | null
}

type Quote = {
  id: string
  recipient: string
  site_name?: string
  subtotal: number
  tax_amount: number
  grand_total: number
  status: string
  issued_date: string
  quote_items: QuoteItem[]
  own_company?: {
    company_name: string | null
    address: string | null
    phone: string | null
    logo_url: string | null
  }
}

export default function QuotePrint({ quote }: { quote: Quote }) {
  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getItemLabel = (item: QuoteItem): string => {
    if (item.textProduct) {
      return item.textProduct.name
    }
    if (item.product) {
      return item.product.spec ? `${item.product.name} (${item.product.spec})` : item.product.name
    }
    return '不明な商品'
  }

  const formatPrice = (price: number): string => {
    return `¥${price.toLocaleString('ja-JP')}`
  }

  return (
    <div style={s.container}>
      {/* ヘッダー */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          {quote.own_company?.logo_url && (
            <Image 
              src={quote.own_company.logo_url} 
              alt="会社ロゴ" 
              style={s.logo}
              width={120}
              height={60}
            />
          )}
          <div style={s.companyInfo}>
            <div style={s.companyName}>{quote.own_company?.company_name || ''}</div>
            <div style={s.companyAddress}>{quote.own_company?.address || ''}</div>
            <div style={s.companyPhone}>{quote.own_company?.phone || ''}</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.documentTitle}>見積書</div>
          <div style={s.documentNumber}>No. {quote.id.slice(-8)}</div>
          <div style={s.documentDate}>{formatDate(quote.issued_date)}</div>
        </div>
      </div>

      {/* 宛先 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>宛先</div>
        <div style={s.recipient}>
          <div style={s.recipientName}>{quote.recipient}御中</div>
          {quote.site_name && <div style={s.siteName}>{quote.site_name}</div>}
        </div>
      </div>

      {/* 商品明細 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>見積内容</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>品名</th>
              <th style={s.th}>数量</th>
              <th style={s.th}>単価</th>
              <th style={s.th}>金額</th>
            </tr>
          </thead>
          <tbody>
            {quote.quote_items.map(item => (
              <tr key={item.id}>
                <td style={s.td}>{getItemLabel(item)}</td>
                <td style={s.td}>{item.quantity}</td>
                <td style={s.td}>{formatPrice(1000)}</td>
                <td style={s.td}>{formatPrice(item.quantity * 1000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 合計 */}
      <div style={s.summary}>
        <div style={s.summaryRow}>
          <span style={s.summaryLabel}>小計:</span>
          <span style={s.summaryValue}>{formatPrice(quote.subtotal)}</span>
        </div>
        <div style={s.summaryRow}>
          <span style={s.summaryLabel}>消費税:</span>
          <span style={s.summaryValue}>{formatPrice(quote.tax_amount)}</span>
        </div>
        <div style={s.summaryRow}>
          <span style={s.summaryLabel}>合計:</span>
          <span style={{ ...s.summaryValue, fontWeight: 700 }}>
            {formatPrice(quote.grand_total)}
          </span>
        </div>
      </div>

      {/* 備考 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>備考</div>
        <div style={s.remarks}>
          ・本見積書の有効期限は発行日より30日間とします<br/>
          ・内容にご不満な点がございましたら、お気軽にお問い合わせください
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  container: {
    padding: '20mm',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12pt',
    lineHeight: 1.6,
    color: '#000',
    background: '#fff',
    minHeight: '297mm',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20mm',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10mm',
  },
  logo: {
    maxHeight: '20mm',
    maxWidth: '40mm',
    objectFit: 'contain',
  },
  companyInfo: {
    fontSize: '10pt',
  },
  companyName: {
    fontWeight: 700,
    marginBottom: '2mm',
  },
  companyAddress: {
    marginBottom: '1mm',
  },
  companyPhone: {
    marginBottom: '1mm',
  },
  headerRight: {
    textAlign: 'right',
  },
  documentTitle: {
    fontSize: '18pt',
    fontWeight: 700,
    marginBottom: '5mm',
  },
  documentNumber: {
    fontSize: '12pt',
    marginBottom: '2mm',
  },
  documentDate: {
    fontSize: '11pt',
  },
  section: {
    marginBottom: '15mm',
  },
  sectionTitle: {
    fontSize: '14pt',
    fontWeight: 700,
    marginBottom: '5mm',
    borderBottom: '1px solid #000',
    paddingBottom: '2mm',
  },
  recipient: {
    marginBottom: '10mm',
  },
  recipientName: {
    fontSize: '14pt',
    fontWeight: 700,
    marginBottom: '2mm',
  },
  siteName: {
    fontSize: '12pt',
    color: '#666',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10mm',
  },
  th: {
    border: '1px solid #000',
    padding: '3mm',
    backgroundColor: '#f5f5f5',
    fontSize: '10pt',
    fontWeight: 700,
    textAlign: 'left',
  },
  td: {
    border: '1px solid #000',
    padding: '3mm',
    fontSize: '10pt',
  },
  summary: {
    textAlign: 'right',
    marginBottom: '15mm',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '2mm',
  },
  summaryLabel: {
    fontSize: '12pt',
    marginRight: '10mm',
    minWidth: '60mm',
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: '12pt',
    minWidth: '80mm',
    textAlign: 'right',
  },
  remarks: {
    fontSize: '10pt',
    lineHeight: 1.8,
  },
}
