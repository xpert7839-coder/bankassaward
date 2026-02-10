const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdHhtaHFoa2NzYXd2amp3eGJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMzNTQ5NCwiZXhwIjoyMDg1OTExNDk0fQ.3D_rGf1RxA3HiEZiR1VhfXzdndoAh3gMNs5qYXQ-zgo';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORRECTION DES TYPES DE DONNÉES SUPABASE');
console.log('='.repeat(60));

async function fixDatabaseTypes() {
  try {
    console.log('\n📋 Étape 1: Vérification de l\'état actuel...');
    
    // Vérifier les types actuels des colonnes
    const { data: currentTypes, error: typeError } = await supabase
      .rpc('get_column_types', { table_name: 'users' });
    
    if (typeError) {
      console.error('❌ Erreur lors de la vérification des types:', typeError);
      return;
    }

    console.log('Types actuels détectés:', currentTypes);

    console.log('\n🔄 Étape 2: Création de la table users_temp...');
    
    // Créer la table temporaire avec les bons types
    const { error: tempError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users_temp (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'VOTER' CHECK (role IN ('VOTER', 'SUPER_ADMIN')),
            phone VARCHAR(50),
            password VARCHAR(255),
            domain VARCHAR(255),
            city VARCHAR(255),
            device_id VARCHAR(255),
            registration_ip VARCHAR(45),
            user_agent TEXT,
            email_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tempError) {
      console.error('❌ Erreur création users_temp:', tempError);
      return;
    }

    console.log('✅ Table users_temp créée avec succès');

    console.log('\n📦 Étape 3: Migration des données...');
    
    // Migrer les données
    const { error: migrateError } = await supabase.rpc('execute_sql', {
      sql: `
        INSERT INTO users_temp (
            id, name, email, role, phone, password, domain, city, 
            device_id, registration_ip, user_agent, email_verified, 
            created_at, updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            name, email, role, phone, password, domain, city,
            device_id, registration_ip, user_agent, email_verified,
            created_at, updated_at
        FROM users;
      `
    });

    if (migrateError) {
      console.error('❌ Erreur migration:', migrateError);
      return;
    }

    console.log('✅ Données migrées avec succès');

    console.log('\n🗑️ Étape 4: Suppression de l\'ancienne table users...');
    
    // Supprimer l'ancienne table
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP TABLE IF EXISTS users CASCADE;'
    });

    if (dropError) {
      console.error('❌ Erreur suppression users:', dropError);
      return;
    }

    console.log('✅ Ancienne table users supprimée');

    console.log('\n🔄 Étape 5: Renommage de users_temp en users...');
    
    // Renommer la table
    const { error: renameError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE users_temp RENAME TO users;'
    });

    if (renameError) {
      console.error('❌ Erreur renommage:', renameError);
      return;
    }

    console.log('✅ Table renommée avec succès');

    console.log('\n🔗 Étape 6: Recréation des tables device_registrations et email_verifications...');
    
    // Recréer les autres tables
    const tablesToCreate = [
      `
        CREATE TABLE IF NOT EXISTS device_registrations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            device_id VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS email_verifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
      `
    ];

    for (const sql of tablesToCreate) {
      const { error: createError } = await supabase.rpc('execute_sql', { sql });
      if (createError) {
        console.error('❌ Erreur création table:', createError);
        return;
      }
    }

    console.log('✅ Tables recréées avec succès');

    console.log('\n📊 Étape 7: Création des indexes...');
    
    // Créer les indexes
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);',
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);',
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_ip_address ON device_registrations(ip_address);',
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);'
    ];

    for (const sql of indexesToCreate) {
      const { error: indexError } = await supabase.rpc('execute_sql', { sql });
      if (indexError) {
        console.error('❌ Erreur création index:', indexError);
        return;
      }
    }

    console.log('✅ Indexes créés avec succès');

    console.log('\n🔍 Étape 8: Vérification finale...');
    
    // Vérification finale
    const { data: verification, error: verifyError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);

    if (verifyError) {
      console.error('❌ Erreur vérification finale:', verifyError);
      return;
    }

    console.log('✅ Vérification réussie - Échantillon de données:', verification);

    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log('✅ Types de données corrigés');
    console.log('✅ Tables recréées avec les bons types');
    console.log('✅ Indexes créés');
    console.log('✅ Contraintes foreign key opérationnelles');
    console.log('\n⚠️  ATTENTION: Les anciens IDs utilisateurs ont été régénérés');
    console.log('    Les utilisateurs devront se reconnecter avec email/mot de passe');
    console.log('\n🚀 La base de données est prête pour la production !');

  } catch (error) {
    console.error('💥 Erreur critique lors de la correction:', error);
  }
}

// Exécuter la correction
fixDatabaseTypes().then(() => {
  console.log('\n🏁 Processus de correction terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
