import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTablesAndData() {
  try {
    console.log('🚀 Création des tables et insertion des données...')
    
    // 1. Créer l'administrateur
    console.log('👤 Création de l\'administrateur...')
    const { data: admin, error: adminError } = await supabase
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
      .select()
      .single()
    
    if (adminError && !adminError.message.includes('duplicate')) {
      console.log('⚠️ Erreur admin (table peut ne pas exister):', adminError.message)
    } else {
      console.log('✅ Administrateur créé avec succès')
    }
    
    // 2. Créer les catégories
    console.log('📁 Création des catégories...')
    
    const categories = [
      {
        id: 'trophee-leadership',
        name: 'Prix d\'Honneur Leadership',
        subtitle: '- Révéler à la fin du vote',
        special: true,
        is_leadership_prize: true,
        pre_assigned_winner: 'Kassim Guindo',
        pre_assigned_winner_image: '/kassim-guindo-portrait-leadership.jpg',
        pre_assigned_winner_bio: 'Kassim Guindo, figure emblématique de Bankass, demeure une légende vivante dans le cœur de tous ceux qui l\'ont connu. Visionnaire et leader naturel, il a consacré sa vie à l\'émancipation de sa communauté, croyant fermement que chaque jeune de Bankass portait en lui les graines de la grandeur. Son parcours, marqué par une détermination sans faille et une générosité infinie, a inspiré des générations entières. Qu\'il soit parmi nous ou qu\'il veille sur nous depuis les étoiles, son héritage reste immortel.',
        pre_assigned_winner_achievements: [
          'Fondateur du mouvement Winner Boys',
          'Mentor de centaines de jeunes de Bankass',
          'Pionnier du développement communautaire local',
          'Symbole d\'espoir et de résilience pour toute une génération',
          'Bâtisseur de ponts entre tradition et modernité'
        ],
        pre_assigned_winner_tribute: `À toi, Kassim,

Tu es de ceux dont on ne sait jamais vraiment s\'ils sont partis ou s\'ils sont simplement passés dans une autre dimension de l\'existence. Car comment pourrait-on dire qu\'un homme comme toi a disparu, quand chaque rue de Bankass porte encore l\'écho de tes pas, quand chaque jeune que tu as guidé continue de porter ta flamme ?

Tu nous as appris que le leadership n\'est pas une question de titre, mais de cœur. Que la vraie richesse se mesure non pas à ce que l\'on possède, mais à ce que l\'on donne. Tu as été le père que beaucoup n\'ont jamais eu, le frère sur qui l\'on pouvait compter, l\'ami qui ne jugeait jamais.

Si tu es là-haut, sache que nous pensons à toi chaque jour.
Si tu es quelque part ici-bas, sache que nous te cherchons encore.
Où que tu sois, sache que tu es aimé, honoré, et jamais oublié.

Ce trophée porte ton nom. Cette cérémonie célèbre ta mémoire. Cet héritage est le tien.

Avec tout notre amour et notre gratitude éternelle,
La famille Bankass Awards et les Winner Boys`
      },
      {
        id: 'revelation',
        name: 'Révélation de l\'Année',
        subtitle: 'Découverte du nouveau talent qui a marqué l\'année',
        special: false,
        is_leadership_prize: false
      },
      {
        id: 'meilleure-chanson',
        name: 'Meilleure Chanson de l\'Année',
        subtitle: 'Le titre qui a marqué les esprits cette année',
        special: false,
        is_leadership_prize: false
      },
      {
        id: 'meilleur-artiste',
        name: 'Meilleur Artiste de l\'Année',
        subtitle: 'Récompenser l\'excellence artistique et l\'impact culturel',
        special: false,
        is_leadership_prize: false
      }
    ]
    
    for (const category of categories) {
      const { error: catError } = await supabase
        .from('categories')
        .upsert(category, {
          onConflict: 'id'
        })
      
      if (catError && !catError.message.includes('duplicate') && !catError.message.includes('does not exist')) {
        console.log(`⚠️ Erreur catégorie ${category.name}:`, catError.message)
      } else {
        console.log(`✅ Catégorie "${category.name}" créée`)
      }
    }
    
    // 3. Créer les candidats
    console.log('🎭 Création des candidats...')
    
    const candidates = [
      // Révélation
      { id: 'rev-1', category_id: 'revelation', name: 'Bakary Sangaré', alias: 'Baka', image: '/african-man-artist-portrait-young.jpg', bio: 'Jeune artiste émergent de Bankass, son style unique mélange tradition et modernité.', achievements: ['Premier concert solo à Bamako', '100 000 vues sur YouTube', 'Artiste local de l\'année 2024'], song_count: 5, candidate_song: 'Bankass Revolution' },
      { id: 'rev-2', category_id: 'revelation', name: 'Aminata Dicko', alias: 'Mina', image: '/african-woman-singer-portrait-rising.jpg', bio: 'Voix douce mais puissante, elle chante l\'espoir et la résilience de la jeunesse malienne.', achievements: ['Premier album en production', 'Collaboration avec Oumou Sangaré', 'Révélation du Festival au Désert'], song_count: 8, candidate_song: 'Espoir' },
      
      // Meilleure chanson
      { id: 'mc-1', category_id: 'meilleure-chanson', name: 'Oumou Sangaré', alias: 'La Dame de Mopti', image: '/music-album-cover-gold-artistic.jpg', bio: 'Titre phénomène ayant battu tous les records de streaming, devenu un hymne générationnel.', achievements: ['1 milliard de streams', 'Disque de diamant', 'Chanson de la décennie'], song_count: 12, candidate_song: 'Djadja' },
      { id: 'mc-2', category_id: 'meilleure-chanson', name: 'Fatoumata Diawara', alias: 'Fatou', image: '/music-album-cover-african-artistic.jpg', bio: 'Chanson engagée célébrant la paix et l\'unité au Mali, mêlant sonorités traditionnelles.', achievements: ['Prix de la meilleure chanson africaine', 'Message de paix', 'Clip primé'], song_count: 15, candidate_song: 'Kouma' },
      
      // Meilleur artiste
      { id: 'ma-1', category_id: 'meilleur-artiste', name: 'Rokia Traoré', alias: 'La Voix d\'Or', image: '/african-woman-musician-portrait-artistic.jpg', bio: 'Chanteuse, guitariste et compositrice malienne, figure majeure de la musique africaine contemporaine.', achievements: ['Victoire de la Musique', 'Collaboration internationale', 'Directrice artistique du Festival au Désert'], song_count: 45, candidate_song: 'Mali Sadio' },
      { id: 'ma-2', category_id: 'meilleur-artiste', name: 'Aya Nakamura', alias: 'La Reine du Pop Urbaine', image: '/african-woman-singer-portrait-glamour.jpg', bio: 'Chanteuse franco-malienne, artiste francophone la plus écoutée au monde.', achievements: ['Album de diamant', 'NRJ Music Award', 'Artiste francophone #1 mondial'], song_count: 32, candidate_song: 'Djadja' }
    ]
    
    for (const candidate of candidates) {
      const { error: candError } = await supabase
        .from('candidates')
        .upsert(candidate, {
          onConflict: 'id'
        })
      
      if (candError && !candError.message.includes('duplicate') && !candError.message.includes('does not exist')) {
        console.log(`⚠️ Erreur candidat ${candidate.name}:`, candError.message)
      } else {
        console.log(`✅ Candidat "${candidate.name}" créé`)
      }
    }
    
    // 4. Créer les paramètres
    console.log('⚙️ Création des paramètres...')
    
    const settings = [
      { key: 'leadership_revealed', value: false },
      { key: 'voting_enabled', value: true },
      { key: 'app_version', value: '1.0.0' }
    ]
    
    for (const setting of settings) {
      const { error: settingError } = await supabase
        .from('app_settings')
        .upsert(setting, {
          onConflict: 'key'
        })
      
      if (settingError && !settingError.message.includes('duplicate') && !settingError.message.includes('does not exist')) {
        console.log(`⚠️ Erreur paramètre ${setting.key}:`, settingError.message)
      } else {
        console.log(`✅ Paramètre "${setting.key}" créé`)
      }
    }
    
    console.log('\n🎉 Configuration terminée avec succès!')
    console.log('📋 Données insérées:')
    console.log('- 1 administrateur')
    console.log(`- ${categories.length} catégories`)
    console.log(`- ${candidates.length} candidats`)
    console.log('- 3 paramètres d\'application')
    
    console.log('\n🚀 Vous pouvez maintenant lancer l\'application:')
    console.log('npm run dev')
    
  } catch (error) {
    console.error('💥 Erreur critique:', error)
  }
}

createTablesAndData()
