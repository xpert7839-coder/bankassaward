// Script pour exécuter le SQL de correction sur Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLFix() {
  try {
    console.log('🔧 Exécution du script SQL de correction...');
    
    // Lire le fichier SQL
    const fs = require('fs');
    const sqlContent = fs.readFileSync('fix-leadership-sql.sql', 'utf8');
    
    // Exécuter le SQL via l'API REST de Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ 
        query: sqlContent 
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur SQL:', error);
      
      // Alternative: créer directement la catégorie sans les colonnes
      console.log('🔄 Tentative alternative...');
      
      const basicCategory = {
        name: 'Prix d\'Honneur Leadership',
        description: '- Révéler à la fin du vote',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert(basicCategory)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erreur insertion alternative:', insertError.message);
      } else {
        console.log('✅ Catégorie de base créée:', data.name);
        console.log('⚠️ Vous devrez ajouter manuellement les colonnes leadership dans Supabase');
      }
      
    } else {
      const result = await response.json();
      console.log('✅ SQL exécuté avec succès !');
    }
    
    // Vérifier le résultat
    console.log('\n🔍 Vérification des catégories...');
    const { data: categories } = await supabase
      .from('categories')
      .select('*');
    
    const leadershipCat = categories?.find(cat => 
      cat.name?.toLowerCase().includes('leadership')
    );
    
    if (leadershipCat) {
      console.log('✅ Catégorie Leadership trouvée:', leadershipCat.name);
    } else {
      console.log('❌ Catégorie Leadership non trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

executeSQLFix();
