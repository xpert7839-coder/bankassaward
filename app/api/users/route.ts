import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

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
    const { name, phone, password, role = 'VOTER', domain, city } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json({ error: 'Nom et téléphone requis' }, { status: 400 })
    }

    // Vérifier si le téléphone existe déjà
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 400 })
    }

    // Hasher le mot de passe si fourni
    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Créer l'utilisateur
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: `${phone.replace(/\D/g, '')}@bankass-awards.local`, // Email par défaut pour la contrainte NOT NULL
        password: hashedPassword,
        role,
        domain,
        city,
        phone
      })
      .select()
      .single()

    if (error) {
      // Message d'erreur clair en français
      if (error.message?.includes('null value in column "email"')) {
        return NextResponse.json({ 
          error: "Erreur: L'adresse email est requise. Veuillez contacter l'administrateur." 
        }, { status: 400 })
      }
      if (error.message?.includes('already exists')) {
        return NextResponse.json({ 
          error: "Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter." 
        }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
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
