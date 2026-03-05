// POST /api/masters/own/logo  — 会社ロゴアップロード
// DELETE /api/masters/own/logo  — 会社ロゴ削除

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function POST(req: Request) {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // Validate file type (allow common image formats)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '対応している画像形式は JPEG, PNG, GIF, WebP です（最大5MB）' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
    }

    // Check if storage bucket exists, create if not
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === 'company-logos')
      
      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket('company-logos', {
          public: true,
          allowedMimeTypes: allowedTypes,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        })
        
        if (bucketError) {
          console.error('Bucket creation error:', bucketError)
          return NextResponse.json({ error: 'ストレージの初期化に失敗しました' }, { status: 500 })
        }
      }
    } catch (bucketError) {
      console.error('Bucket check error:', bucketError)
      // Continue anyway - bucket might exist but we can't check due to permissions
    }

    // Upload to Supabase Storage
    const fileName = `logo_${tenantId}_${Date.now()}.${file.type.split('/')[1]}`
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)

    // Update tenant record with logo URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('tenants')
      .update({ logo_url: publicUrl })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'ロゴの保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      logo_url: publicUrl 
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'アップロード中にエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  try {
    // Get current logo URL to delete the file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant } = await (supabase as any)
      .from('tenants')
      .select('logo_url')
      .eq('id', tenantId)
      .single()

    if (tenant?.logo_url) {
      // Extract file path from URL and delete from storage
      const filePath = tenant.logo_url.split('/').pop()
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('company-logos')
          .remove([filePath])

        if (deleteError) {
          console.error('Delete error:', deleteError)
        }
      }
    }

    // Remove logo URL from tenant record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('tenants')
      .update({ logo_url: null })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'ロゴの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: '削除中にエラーが発生しました' }, { status: 500 })
  }
}
