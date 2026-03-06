// POST   /api/masters/own/logo  — 会社ロゴアップロード
// DELETE /api/masters/own/logo  — 会社ロゴ削除

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

const BUCKET = 'company-logos'

// ファイル種別 → 拡張子マップ
const ALLOWED_TYPES: Record<string, string> = {
  'image/png':     'png',
  'image/jpeg':    'jpg',
  'image/svg+xml': 'svg',
}

const MAX_BYTES = 2 * 1024 * 1024 // 2MB

export async function POST(req: Request) {
  // ── 認証・テナント確認（通常クライアント） ────────────────────────────
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // ── ファイル取得・バリデーション ──────────────────────────────────────
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'PNG / JPEG / SVG のみ対応しています' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'ファイルサイズは2MB以下にしてください' }, { status: 400 })
  }

  // ── 管理者クライアント（RLS バイパス・Storage 権限あり） ───────────────
  const admin = createAdminClient()

  // バケットが存在しなければ作成（idempotent）
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error: bucketErr } = await admin.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: Object.keys(ALLOWED_TYPES),
      fileSizeLimit: MAX_BYTES,
    })
    if (bucketErr) {
      console.error('Bucket creation error:', bucketErr)
      return NextResponse.json({ error: 'ストレージの初期化に失敗しました' }, { status: 500 })
    }
  }

  // ── アップロード ──────────────────────────────────────────────────────
  // 既存ファイルをまず削除（同じテナントの古いロゴ）
  const { data: existingTenant } = await admin
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .single()

  if (existingTenant?.logo_url) {
    const oldFile = existingTenant.logo_url.split('/').pop()
    if (oldFile) await admin.storage.from(BUCKET).remove([oldFile])
  }

  // 新しいファイルをアップロード
  const fileName = `logo_${tenantId}_${Date.now()}.${ext}`
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }

  // ── 公開 URL 取得 ────────────────────────────────────────────────────
  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(fileName)

  // ── DB 更新（admin でないと RLS で弾かれる） ──────────────────────────
  const { error: updateError } = await admin
    .from('tenants')
    .update({ logo_url: publicUrl })
    .eq('id', tenantId)

  if (updateError) {
    console.error('DB update error:', updateError)
    return NextResponse.json({ error: 'ロゴURLの保存に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true, logo_url: publicUrl })
}

export async function DELETE() {
  // ── 認証・テナント確認 ────────────────────────────────────────────────
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const admin = createAdminClient()

  // ── 既存ロゴファイルを削除 ────────────────────────────────────────────
  const { data: tenant } = await admin
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .single()

  if (tenant?.logo_url) {
    const filePath = tenant.logo_url.split('/').pop()
    if (filePath) {
      const { error: deleteError } = await admin.storage.from(BUCKET).remove([filePath])
      if (deleteError) console.error('Storage delete error:', deleteError)
    }
  }

  // ── DB から logo_url をクリア ─────────────────────────────────────────
  const { error: updateError } = await admin
    .from('tenants')
    .update({ logo_url: null })
    .eq('id', tenantId)

  if (updateError) {
    console.error('DB update error:', updateError)
    return NextResponse.json({ error: 'ロゴの削除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
