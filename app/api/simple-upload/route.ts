import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Initialiser Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Validation simple
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Veuillez fournir une image' }, { status: 400 })
    }

    console.log('📁 Fichier reçu:', file.name, file.type, file.size)

    // En production, utiliser Supabase Storage
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 Upload vers Supabase Storage...')
      
      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop() || 'jpg'
      const fileName = `candidates/${timestamp}_${random}.${extension}`

      // Convertir File en Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Erreur Supabase upload:', error)
        return NextResponse.json({ 
          error: 'Erreur lors de l\'upload: ' + error.message 
        }, { status: 500 })
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      console.log('✅ Fichier uploadé sur Supabase:', publicUrl)

      return NextResponse.json({ 
        success: true, 
        url: publicUrl 
      })

    } else {
      // En développement, utiliser le stockage local
      console.log('💻 Upload local (développement)...')
      
      // Créer le dossier s'il n'existe pas
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'candidates')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}_${random}.${extension}`
      const filePath = join(uploadDir, fileName)

      // Convertir File en Buffer et sauvegarder
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(filePath, buffer)

      // Retourner l'URL locale avec le bon port
      const requestUrl = new URL(request.url)
      const port = requestUrl.port || '3000'
      const publicUrl = `http://localhost:${port}/uploads/candidates/${fileName}`
      
      console.log('✅ Fichier uploadé localement:', publicUrl)
      
      return NextResponse.json({ 
        success: true, 
        url: publicUrl 
      })
    }

  } catch (error) {
    console.error('❌ Erreur upload simple:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
    }, { status: 500 })
  }
}
