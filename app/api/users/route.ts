import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { getClientIP, checkDeviceAccountLimit, recordDeviceRegistration } from '@/lib/device-tracking'

// GET - Récupérer tous les utilisateurs ou recherche par email/téléphone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    let query = supabaseAdmin.from('users').select('*')

    // Si un email ou téléphone est spécifié, filtrer
    if (email) {
      query = query.eq('email', email)
    } else if (phone) {
      query = query.eq('phone', phone)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      password, 
      role = 'VOTER', 
      domain, 
      city, 
      device_id,
      email_verified = false 
    } = body

    // Validation - accepte soit email soit téléphone
    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'Nom et email ou téléphone requis' }, { status: 400 })
    }

    // Obtenir l'IP client
    const clientIP = await getClientIP(request)

    // TEMPORAIREMENT DÉSACTIVÉ: Limite de comptes pour permettre les inscriptions en production
    // Le problème vient du fait que tous les utilisateurs partagent la même IP en production
    // TODO: Réimplémenter avec une meilleure détection d'IP unique
    if (false && device_id) {
      const { canCreate, existingAccounts } = await checkDeviceAccountLimit(
        supabaseAdmin,
        device_id,
        clientIP
      )

      if (!canCreate) {
        return NextResponse.json({ 
          error: `Limite de comptes atteinte. Ce device/IP a déjà créé ${existingAccounts} compte(s). Maximum autorisé: 1 par device, 3 par IP.` 
        }, { status: 429 })
      }
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (email) {
      const { data: existingEmailUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingEmailUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
      }
    }

    // Vérifier si le téléphone existe déjà (si fourni)
    if (phone) {
      const { data: existingPhoneUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single()

      if (existingPhoneUser) {
        return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 400 })
      }
    }

    // Hasher le mot de passe si fourni
    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Générer un email fictif si aucun email n'est fourni (pour les comptes téléphone uniquement)
    const finalEmail = email || `user_${Date.now()}@bankassawards.local`
    
    // Créer l'utilisateur avec les informations de tracking
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: finalEmail, // Email toujours non nul
        phone: phone || null, // Téléphone optionnel pour les anciens comptes
        password: hashedPassword,
        role,
        domain,
        city,
        device_id: device_id || null,
        registration_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        email_verified: email_verified
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enregistrer les informations de device si disponible
    if (device_id && data?.id) {
      await recordDeviceRegistration(
        supabaseAdmin,
        data.id,
        device_id,
        clientIP,
        request.headers.get('user-agent') || ''
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    // Hasher le mot de passe si fourni
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
