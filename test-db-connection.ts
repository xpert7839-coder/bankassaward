import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à Supabase...')
    
    // Test simple: lister les tables
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single()
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      
      // Si la table n'existe pas, on essaie de la créer
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📝 La table users n\'existe pas, création des tables...')
        await createTables()
      }
    } else {
      console.log('✅ Connexion réussie! Tables existantes.')
    }
  } catch (err) {
    console.error('💥 Erreur critique:', err)
  }
}

async function createTables() {
  try {
    // Créer la table users
    const { error: usersError } = await supabase.rpc('create_users_table')
    if (usersError) console.log('⚠️ Table users peut déjà exister ou RPC non disponible:', usersError.message)
    
    // Insérer l'admin par défaut
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: 'super_admin_001',
        name: 'Super Admin',
        email: 'admin@bankassawards.com',
        role: 'SUPER_ADMIN',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    if (insertError) {
      console.error('❌ Erreur insertion admin:', insertError.message)
    } else {
      console.log('✅ Admin créé avec succès')
    }
    
  } catch (err) {
    console.error('💥 Erreur création tables:', err)
  }
}

testConnection()
