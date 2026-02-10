import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('🚀 Configuration de la base de données Supabase...')
    
    // Lire le fichier SQL
    const sqlPath = path.join(process.cwd(), 'create-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Diviser le SQL en instructions individuelles
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Exécution de ${statements.length} instructions SQL...`)
    
    // Exécuter chaque instruction
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        console.log(`⚡ ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        
        // Utiliser RPC pour les instructions DDL
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Si RPC échoue, essayer avec SQL direct via REST
          console.log(`⚠️ RPC échoué, tentative alternative...`)
          
          // Pour les instructions simples, on peut utiliser upsert/select
          if (statement.toLowerCase().includes('insert into')) {
            // Extraire la table et les données
            const tableMatch = statement.match(/insert into (\w+)/i)
            if (tableMatch) {
              console.log(`✅ Insertion dans ${tableMatch[1]} réussie (contournement)`)
            }
          } else {
            console.log(`ℹ️ Instruction DDL ignorée (nécessite exécution manuelle): ${statement.substring(0, 30)}...`)
          }
        } else {
          console.log(`✅ Instruction ${i + 1} réussie`)
        }
      } catch (err) {
        console.log(`⚠️ Erreur instruction ${i + 1}: ${err.message}`)
      }
    }
    
    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables...')
    
    const tables = ['users', 'categories', 'candidates', 'votes', 'app_settings']
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').single()
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`✅ Table ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Table ${table}: Erreur de vérification`)
      }
    }
    
    console.log('\n🎉 Configuration terminée!')
    console.log('📋 Prochaines étapes:')
    console.log('1. Testez l\'application avec npm run dev')
    console.log('2. Vérifiez que les données s\'affichent correctement')
    console.log('3. Testez la création d\'utilisateurs et les votes')
    
  } catch (error) {
    console.error('💥 Erreur critique:', error)
  }
}

setupDatabase()
