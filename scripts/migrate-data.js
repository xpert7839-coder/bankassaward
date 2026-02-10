const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Début de la migration des données...');
  
  try {
    // Vérifier la connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');

    // Compter les enregistrements existants
    const usersCount = await prisma.user.count();
    const categoriesCount = await prisma.category.count();
    const candidatesCount = await prisma.candidate.count();
    const votesCount = await prisma.vote.count();

    console.log(`📊 Données existantes:`);
    console.log(`   - Utilisateurs: ${usersCount}`);
    console.log(`   - Catégories: ${categoriesCount}`);
    console.log(`   - Candidats: ${candidatesCount}`);
    console.log(`   - Votes: ${votesCount}`);

    // Si aucune donnée, proposer de créer des données de test
    if (usersCount === 0 && categoriesCount === 0) {
      console.log('\n🔧 Aucune donnée trouvée. Création des données de test...');
      await createTestData();
    }

    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestData() {
  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@bankass.com',
      role: 'SUPER_ADMIN',
      domain: 'bankass.com',
      city: 'Abidjan'
    }
  });

  // Créer des catégories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Meilleur Artiste Masculin',
        subtitle: 'Récompense pour le meilleur artiste masculin de l\'année',
        special: false
      }
    }),
    prisma.category.create({
      data: {
        name: 'Meilleure Artiste Féminin',
        subtitle: 'Récompense pour la meilleure artiste féminine de l\'année',
        special: false
      }
    }),
    prisma.category.create({
      data: {
        name: 'Prix du Leadership',
        subtitle: 'Récompense spéciale pour leadership exceptionnel',
        special: true,
        isLeadershipPrize: true,
        preAssignedWinner: 'Leader Exemplaire',
        preAssignedWinnerBio: 'Une personne ayant démontré un leadership exceptionnel dans la communauté',
        preAssignedWinnerAchievements: ['Leadership communautaire', 'Innovation sociale', 'Inspiration pour les jeunes'],
        preAssignedWinnerTribute: 'En reconnaissance de son dévouement et de son impact positif'
      }
    })
  ]);

  // Créer des candidats pour chaque catégorie (sauf leadership)
  for (const category of categories.filter(c => !c.isLeadershipPrize)) {
    const candidates = await Promise.all([
      prisma.candidate.create({
        data: {
          categoryId: category.id,
          name: `Artiste ${category.name.includes('Masculin') ? 'Alpha' : 'Beta'} 1`,
          image: '/images/artist1.jpg',
          bio: 'Artiste talentueux avec une carrière impressionnante',
          achievements: ['Album de platine', 'Concerts internationaux', 'Récompenses multiples']
        }
      }),
      prisma.candidate.create({
        data: {
          categoryId: category.id,
          name: `Artiste ${category.name.includes('Masculin') ? 'Gamma' : 'Delta'} 2`,
          image: '/images/artist2.jpg',
          bio: 'Artiste innovant et créatif',
          achievements: ['Innovation musicale', 'Collaborations prestigieuses', 'Impact culturel']
        }
      })
    ]);
  }

  console.log('📝 Données de test créées avec succès');
}

if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateData, createTestData };
