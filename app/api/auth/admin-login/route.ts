import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Créer un client Supabase pour le serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Rechercher l'admin dans la base de données
    const { data: admin, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'ADMIN')
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Administrateur non trouvé' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe (en production, utiliser bcrypt)
    if (admin.password !== password) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Mettre à jour la dernière connexion
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // Retourner les informations de l'admin (sans le mot de passe)
    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json({
      success: true,
      user: {
        ...adminWithoutPassword,
        isAdmin: true
      }
    })

  } catch (error) {
    console.error('Erreur connexion admin:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
