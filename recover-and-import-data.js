const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdHhtaHFoa2NzYXd2amp3eGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzU0OTQsImV4cCI6MjA4NTkxMTQ5NH0.YJ2fxkICoxwp3rmwRjpuESI0gmtINi7S9kzu9f8JUrE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 RÉCUPÉRATION ET EXPORT DES DONNÉES SUPABASE');
console.log('='.repeat(60));

async function recoverAndExportData() {
  try {
    console.log('\n🔍 Étape 1: Connexion à Supabase...');
    
    // Test de connexion
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message);
      return;
    }

    console.log('✅ Connexion réussie à Supabase');

    console.log('\n📋 Étape 2: Récupération des données existantes...');
    
    let allData = {
      users: [],
      categories: [],
      candidates: [],
      votes: [],
      notifications: [],
      admin_messages: [],
      voting_config: [],
      leadership_prizes: []
    };

    // Récupérer les utilisateurs
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersError && users) {
        allData.users = users;
        console.log(`✅ ${users.length} utilisateurs récupérés`);
      } else {
        console.log('ℹ️ Aucun utilisateur trouvé');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération utilisateurs:', error.message);
    }

    // Récupérer les catégories
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!catError && categories) {
        allData.categories = categories;
        console.log(`✅ ${categories.length} catégories récupérées`);
      } else {
        console.log('ℹ️ Aucune catégorie trouvée');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération catégories:', error.message);
    }

    // Récupérer les candidats
    try {
      const { data: candidates, error: candError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!candError && candidates) {
        allData.candidates = candidates;
        console.log(`✅ ${candidates.length} candidats récupérés`);
      } else {
        console.log('ℹ️ Aucun candidat trouvé');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération candidats:', error.message);
    }

    // Récupérer les votes
    try {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!votesError && votes) {
        allData.votes = votes;
        console.log(`✅ ${votes.length} votes récupérés`);
      } else {
        console.log('ℹ️ Aucun vote trouvé');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération votes:', error.message);
    }

    // Récupérer les notifications
    try {
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!notifError && notifications) {
        allData.notifications = notifications;
        console.log(`✅ ${notifications.length} notifications récupérées`);
      } else {
        console.log('ℹ️ Aucune notification trouvée');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération notifications:', error.message);
    }

    // Récupérer les messages admin
    try {
      const { data: adminMessages, error: adminError } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!adminError && adminMessages) {
        allData.admin_messages = adminMessages;
        console.log(`✅ ${adminMessages.length} messages admin récupérés`);
      } else {
        console.log('ℹ️ Aucun message admin trouvé');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération messages admin:', error.message);
    }

    // Récupérer la configuration de vote
    try {
      const { data: votingConfig, error: configError } = await supabase
        .from('voting_config')
        .select('*');

      if (!configError && votingConfig) {
        allData.voting_config = votingConfig;
        console.log(`✅ ${votingConfig.length} configurations de vote récupérées`);
      } else {
        console.log('ℹ️ Aucune configuration de vote trouvée');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération config vote:', error.message);
    }

    // Récupérer les prix de leadership
    try {
      const { data: leadershipPrizes, error: prizesError } = await supabase
        .from('leadership_prizes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!prizesError && leadershipPrizes) {
        allData.leadership_prizes = leadershipPrizes;
        console.log(`✅ ${leadershipPrizes.length} prix de leadership récupérés`);
      } else {
        console.log('ℹ️ Aucun prix de leadership trouvé');
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération prix leadership:', error.message);
    }

    console.log('\n📊 Étape 3: Génération des fichiers JSON...');
    
    // Créer les fichiers JSON pour chaque table
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const [tableName, data] of Object.entries(allData)) {
      if (data && data.length > 0) {
        const fileName = `export-${tableName}-${timestamp}.json`;
        fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
        console.log(`📄 Fichier créé: ${fileName} (${data.length} enregistrements)`);
      }
    }

    // Créer un fichier JSON complet
    const completeFileName = `export-complete-database-${timestamp}.json`;
    fs.writeFileSync(completeFileName, JSON.stringify(allData, null, 2));
    console.log(`📄 Fichier complet créé: ${completeFileName}`);

    console.log('\n📋 Étape 4: Instructions pour json-to-sql-converter.html...');
    console.log('='.repeat(60));
    
    console.log('\n🎯 UTILISATION DU CONVERTISSEUR:');
    console.log('1. Ouvrez json-to-sql-converter.html dans votre navigateur');
    console.log('2. Copiez les données JSON depuis les fichiers créés');
    console.log('3. Collez dans la section "Données JSON" appropriée');
    console.log('4. Cliquez sur "Générer SQL"');
    console.log('5. Copiez le SQL généré');
    console.log('6. Exécutez dans le dashboard Supabase');

    console.log('\n📊 RÉCAPITULATIF DES DONNÉES:');
    console.log('='.repeat(50));
    console.log(`👥 Utilisateurs: ${allData.users.length}`);
    console.log(`🎭 Catégories: ${allData.categories.length}`);
    console.log(`🎤 Candidats: ${allData.candidates.length}`);
    console.log(`🗳️ Votes: ${allData.votes.length}`);
    console.log(`📢 Notifications: ${allData.notifications.length}`);
    console.log(`📨 Messages Admin: ${allData.admin_messages.length}`);
    console.log(`⚙️ Config Vote: ${allData.voting_config.length}`);
    console.log(`🏆 Prix Leadership: ${allData.leadership_prizes.length}`);

    console.log('\n🎉 OPÉRATION TERMINÉE AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log('✅ Données récupérées et exportées');
    console.log('✅ Fichiers JSON créés pour importation');
    console.log('✅ Prêt pour utilisation avec json-to-sql-converter.html');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
  }
}

// Exécuter la récupération
recoverAndExportData().then(() => {
  console.log('\n🏁 Processus terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
