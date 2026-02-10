const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc2NzIsImV4cCI6MjA4NTU2MzY3Mn0.-9B87ZcM9LLamB0sQjZM60Jz4Hlwg1npeFfIj-Bg_TA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createLeadershipCategory() {
  try {
    console.log('🏆 Création de la catégorie Prix Leadership...');
    
    const leadershipData = {
      name: 'Prix d\'Honneur Leadership',
      description: '- Révéler à la fin du vote',
      is_leadership_prize: true,
      special: true,
      pre_assigned_winner: 'Kassim Guindo',
      pre_assigned_winner_image: '/kassim-guindo-portrait-leadership.jpg',
      pre_assigned_winner_bio: 'Kassim Guindo, figure emblématique de Bankass, demeure une légende vivante dans le cœur de tous ceux qui l\'ont connu. Visionnaire et leader naturel, il a consacré sa vie à l\'émancipation de sa communauté, croyant fermement que chaque jeune de Bankass portait en lui les graines de la grandeur. Son parcours, marqué par une détermination sans faille et une générosité infinie, a inspiré des générations entières. Qu\'il soit parmi nous ou qu\'il veille sur nous depuis les étoiles, son héritage reste immortel.',
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
      console.error('❌ Erreur création:', error.message);
      return;
    }
    
    console.log('✅ Catégorie Leadership créée avec succès !');
    console.log(`📋 ID: ${data.id}`);
    console.log(`🏆 Nom: ${data.name}`);
    console.log(`👤 Gagnant: ${data.pre_assigned_winner}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createLeadershipCategory();
