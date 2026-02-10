const { createClient } = require('@supabase/supabase-js');

// Configuration avec clé anon (pour lecture)
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdHhtaHFoa2NzYXd2amp3eGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzU0OTQsImV4cCI6MjA4NTkxMTQ5NH0.YJ2fxkICoxwp3rmwRjpuESI0gmtINi7S9kzu9f8JUrE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('💾 SAUVEGARDE ET RESTAURATION DES DONNÉES SUPABASE');
console.log('='.repeat(60));

async function backupAndRestoreData() {
  try {
    console.log('\n📋 Étape 1: Tentative de connexion pour récupérer les données...');
    
    // Essayer de récupérer les données existantes
    let backupData = {
      users: [],
      categories: [],
      candidates: [],
      votes: [],
      notifications: [],
      admin_messages: [],
      voting_config: []
    };

    try {
      // Récupérer les utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (!usersError && users) {
        backupData.users = users;
        console.log(`✅ ${users.length} utilisateurs récupérés`);
      } else {
        console.log('ℹ️ Aucun utilisateur trouvé ou table inexistante');
      }

      // Récupérer les catégories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*');

      if (!catError && categories) {
        backupData.categories = categories;
        console.log(`✅ ${categories.length} catégories récupérées`);
      }

      // Récupérer les candidats
      const { data: candidates, error: candError } = await supabase
        .from('candidates')
        .select('*');

      if (!candError && candidates) {
        backupData.candidates = candidates;
        console.log(`✅ ${candidates.length} candidats récupérés`);
      }

      // Récupérer les votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*');

      if (!votesError && votes) {
        backupData.votes = votes;
        console.log(`✅ ${votes.length} votes récupérés`);
      }

      // Récupérer les notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*');

      if (!notifError && notifications) {
        backupData.notifications = notifications;
        console.log(`✅ ${notifications.length} notifications récupérées`);
      }

      // Récupérer les messages admin
      const { data: adminMessages, error: adminError } = await supabase
        .from('admin_messages')
        .select('*');

      if (!adminError && adminMessages) {
        backupData.admin_messages = adminMessages;
        console.log(`✅ ${adminMessages.length} messages admin récupérés`);
      }

      // Récupérer la configuration de vote
      const { data: votingConfig, error: configError } = await supabase
        .from('voting_config')
        .select('*');

      if (!configError && votingConfig) {
        backupData.voting_config = votingConfig;
        console.log(`✅ Configuration de vote récupérée`);
      }

    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération des données:', error.message);
    }

    // Sauvegarder les données dans un fichier
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-data-${timestamp}.json`;
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\n💾 Données sauvegardées dans: ${backupFile}`);

    // Afficher un résumé
    console.log('\n📊 RÉCAPITULATIF DES DONNÉES SAUVEGARDÉES:');
    console.log('='.repeat(50));
    console.log(`👥 Utilisateurs: ${backupData.users.length}`);
    console.log(`🎭 Catégories: ${backupData.categories.length}`);
    console.log(`🎤 Candidats: ${backupData.candidates.length}`);
    console.log(`🗳️ Votes: ${backupData.votes.length}`);
    console.log(`📢 Notifications: ${backupData.notifications.length}`);
    console.log(`📨 Messages admin: ${backupData.admin_messages.length}`);
    console.log(`⚙️ Config voting: ${backupData.voting_config.length}`);

    if (backupData.users.length > 0) {
      console.log('\n📋 ÉCHANTILLON DES UTILISATEURS:');
      backupData.users.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }

    console.log('\n🔧 Étape 2: Instructions pour la restauration...');
    console.log('='.repeat(50));
    console.log('Pour restaurer vos données avec les bons types:');
    console.log('');
    console.log('1. Allez dans le dashboard Supabase');
    console.log('2. Ouvrez SQL Editor');
    console.log('3. Exécutez le script: CREATE_TABLES_FIRST.sql');
    console.log('4. Importez les données depuis le fichier de backup');
    console.log('');
    console.log('📄 Script d\'importation des données:');
    console.log('-- Copiez ce code dans SQL Editor après avoir créé les tables');
    
    // Générer les scripts d'insertion pour chaque table
    if (backupData.users.length > 0) {
      console.log('\n-- Insertion des utilisateurs');
      console.log('INSERT INTO users (name, email, role, phone, password, domain, city, device_id, registration_ip, user_agent, email_verified, created_at, updated_at) VALUES');
      backupData.users.forEach(user => {
        const name = (user.name || '').replace(/'/g, "''");
        const email = (user.email || '').replace(/'/g, "''");
        const role = (user.role || 'VOTER').replace(/'/g, "''");
        const phone = (user.phone || '').replace(/'/g, "''");
        const password = (user.password || '').replace(/'/g, "''");
        const domain = (user.domain || '').replace(/'/g, "''");
        const city = (user.city || '').replace(/'/g, "''");
        const deviceId = (user.device_id || '').replace(/'/g, "''");
        const regIp = (user.registration_ip || '').replace(/'/g, "''");
        const userAgent = (user.user_agent || '').replace(/'/g, "''");
        const emailVerified = user.email_verified || false;
        const createdAt = user.created_at || 'NOW()';
        const updatedAt = user.updated_at || 'NOW()';
        
        console.log(`  ('${name}', '${email}', '${role}', '${phone}', '${password}', '${domain}', '${city}', '${deviceId}', '${regIp}', '${user.userAgent}', ${emailVerified}, '${createdAt}', '${updatedAt}'),`);
      });
      console.log(';');
    }

    if (backupData.categories.length > 0) {
      console.log('\n-- Insertion des catégories');
      console.log('INSERT INTO categories (name, description, created_at, updated_at) VALUES');
      backupData.categories.forEach(cat => {
        const name = (cat.name || '').replace(/'/g, "''");
        const description = (cat.description || '').replace(/'/g, "''");
        const createdAt = cat.created_at || 'NOW()';
        const updatedAt = cat.updated_at || 'NOW()';
        
        console.log(`  ('${name}', '${description}', '${createdAt}', '${updatedAt}'),`);
      });
      console.log(';');
    }

    if (backupData.candidates.length > 0) {
      console.log('\n-- Insertion des candidats');
      console.log('INSERT INTO candidates (name, bio, image_url, audio_file, candidate_song, category_id, created_at, updated_at) VALUES');
      backupData.candidates.forEach(candidate => {
        const name = (candidate.name || '').replace(/'/g, "''");
        const bio = (candidate.bio || '').replace(/'/g, "''");
        const imageUrl = (candidate.image_url || '').replace(/'/g, "''");
        const audioFile = (candidate.audio_file || '').replace(/'/g, "''");
        const song = (candidate.candidate_song || '').replace(/'/g, "''");
        const categoryId = candidate.category_id || 'NULL';
        const createdAt = candidate.created_at || 'NOW()';
        const updatedAt = candidate.updated_at || 'NOW()';
        
        console.log(`  ('${name}', '${bio}', '${imageUrl}', '${audioFile}', '${song}', ${categoryId}, '${createdAt}', '${updatedAt}'),`);
      });
      console.log(';');
    }

    console.log('\n🎯 PROCESSUS TERMINÉ AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log('✅ Données sauvegardées');
    console.log('✅ Scripts d\'importation générés');
    console.log('✅ Prêt pour la restauration');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
  }
}

// Exécuter la sauvegarde
backupAndRestoreData().then(() => {
  console.log('\n🏁 Processus terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
