const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addLeadershipColumns() {
  try {
    console.log('🔧 Ajout des colonnes manquantes...');
    
    // Ajouter les colonnes une par une
    const columns = [
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_leadership_prize BOOLEAN DEFAULT FALSE',
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS special BOOLEAN DEFAULT FALSE',
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS pre_assigned_winner TEXT',
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS pre_assigned_winner_image TEXT',
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS pre_assigned_winner_bio TEXT',
      'ALTER TABLE categories ADD COLUMN IF NOT EXISTS pre_assigned_winner_achievements TEXT[]'
    ];
    
    for (const sql of columns) {
      console.log(`📝 Exécution: ${sql}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`❌ Erreur: ${error.message}`);
      } else {
        console.log('✅ Succès');
      }
    }
    
    // Maintenant créer la catégorie
    console.log('\n🏆 Création de la catégorie Leadership...');
    
    const leadershipData = {
      name: 'Prix d\'Honneur Leadership',
      description: '- Révéler à la fin du vote',
      is_leadership_prize: true,
      special: true,
      pre_assigned_winner: 'Kassim Guindo',
      pre_assigned_winner_image: '/kassim-guindo-portrait-leadership.jpg',
      pre_assigned_winner_bio: 'Kassim Guindo, figure emblématique de Bankass, demeure une légende vivante dans le cœur de tous ceux qui l\'ont connu. Visionnaire et leader naturel, il a consacré sa vie à l\'émancipation de sa communauté, croyant fermement que chaque jeune de Bankass portait en lui les graines de la grandeur.',
      pre_assigned_winner_achievements: [
        'Fondateur du mouvement Winner Boys',
        'Mentor de centaines de jeunes de Bankass',
        'Pionnier du développement communautaire local',
        'Symbole d\'espoir et de résilience pour toute une génération',
        'Bâtisseur de ponts entre tradition et modernité'
      ]
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(leadershipData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur création catégorie:', error.message);
    } else {
      console.log('✅ Catégorie Leadership créée avec succès !');
      console.log(`📋 ID: ${data.id}`);
      console.log(`🏆 Nom: ${data.name}`);
      console.log(`👤 Gagnant: ${data.pre_assigned_winner}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addLeadershipColumns();
