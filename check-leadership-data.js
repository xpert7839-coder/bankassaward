const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc2NzIsImV4cCI6MjA4NTU2MzY3Mn0.-9B87ZcM9LLamB0sQjZM60Jz4Hlwg1npeFfIj-Bg_TA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadershipData() {
  try {
    console.log('🔍 Vérification des données Prix Leadership...');
    
    // Récupérer la catégorie Leadership
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isLeadershipPrize', true);
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    console.log(`📊 Catégories Leadership trouvées: ${categories.length}`);
    
    categories.forEach(cat => {
      console.log(`\n🏆 Catégorie: ${cat.name}`);
      console.log(`👤 Gagnant: ${cat.pre_assigned_winner || 'NON DÉFINI'}`);
      console.log(`🖼️ Image: ${cat.pre_assigned_winner_image || 'NON DÉFINIE'}`);
      console.log(`📝 Bio: ${cat.pre_assigned_winner_bio ? 'DÉFINIE' : 'NON DÉFINIE'}`);
    });
    
    // Si pas de gagnant défini, on le met à jour
    if (categories.length > 0 && !categories[0].pre_assigned_winner) {
      console.log('\n🔧 Mise à jour du gagnant...');
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({
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
        })
        .eq('id', categories[0].id);
      
      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError.message);
      } else {
        console.log('✅ Gagnant mis à jour avec succès !');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkLeadershipData();
