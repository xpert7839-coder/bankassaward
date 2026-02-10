const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc2NzIsImV4cCI6MjA4NTU2MzY3Mn0.-9B87ZcM9LLamB0sQjZM60Jz4Hlwg1npeFfIj-Bg_TA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategoriesStructure() {
  try {
    console.log('🔍 Vérification structure table categories...');
    
    // Récupérer toutes les catégories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    console.log(`📊 Catégories trouvées: ${categories.length}`);
    
    if (categories.length > 0) {
      console.log('\n📋 Colonnes disponibles:');
      Object.keys(categories[0]).forEach(key => {
        console.log(`  - ${key}: ${categories[0][key]}`);
      });
      
      // Chercher la catégorie leadership
      const leadershipCategory = categories.find(cat => 
        cat.name?.toLowerCase().includes('leadership') || 
        cat.name?.toLowerCase().includes('prix') ||
        cat.name?.toLowerCase().includes('honneur')
      );
      
      if (leadershipCategory) {
        console.log('\n🏆 Catégorie Leadership trouvée:');
        console.log(`  Nom: ${leadershipCategory.name}`);
        console.log(`  Gagnant: ${leadershipCategory.pre_assigned_winner || leadershipCategory.preAssignedWinner || 'NON DÉFINI'}`);
      } else {
        console.log('\n❌ Aucune catégorie Leadership trouvée');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkCategoriesStructure();
