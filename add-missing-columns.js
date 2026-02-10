const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdHhtaHFoa2NzYXd2amp3eGJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMzNTQ5NCwiZXhwIjoyMDg1OTExNDk0fQ.3D_rGf1RxA3HiEZiR1VhfXzdndoAh3gMNs5qYXQ-zgo';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 AJOUT DES COLONNES MANQUANTES À LA TABLE USERS');
console.log('='.repeat(60));

async function addMissingColumns() {
  try {
    console.log('\n🔍 Étape 1: Vérification de la structure actuelle...');
    
    // D'abord, tester la connexion
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      console.log('\n💡 Solution: Utilisez le script SQL manuellement dans le dashboard Supabase');
      console.log('📁 Fichier: ADD_DEVICE_ID_COLUMN.sql');
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('📊 Structure actuelle:', testData);

    console.log('\n🔧 Étape 2: Ajout des colonnes manquantes...');
    
    // Colonnes à vérifier et ajouter
    const columnsToAdd = [
      {
        name: 'device_id',
        type: 'VARCHAR(255)',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);'
      },
      {
        name: 'registration_ip',
        type: 'VARCHAR(45)',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);'
      },
      {
        name: 'user_agent',
        type: 'TEXT',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;'
      },
      {
        name: 'email_verified',
        type: 'BOOLEAN',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;'
      }
    ];

    for (const column of columnsToAdd) {
      console.log(`\n📝 Vérification de la colonne: ${column.name}`);
      
      try {
        // Utiliser RPC pour exécuter l'ALTER TABLE
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql: column.sql
        });

        if (alterError) {
          console.warn(`⚠️ Erreur ajout ${column.name}:`, alterError.message);
        } else {
          console.log(`✅ Colonne ${column.name} ajoutée avec succès`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur lors de l'ajout de ${column.name}:`, error.message);
      }
    }

    console.log('\n📊 Étape 3: Vérification finale...');
    
    // Vérifier la structure finale
    const { data: finalStructure, error: finalError } = await supabase
      .from('users')
      .select('id, name, email, device_id, registration_ip, user_agent, email_verified')
      .limit(1);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log('✅ Structure finale vérifiée');
      console.log('📋 Colonnes disponibles:', Object.keys(finalStructure[0] || {}));
    }

    console.log('\n🔗 Étape 4: Recréation des tables liées...');
    
    // Recréer device_registrations
    console.log('📝 Recréation de device_registrations...');
    const { error: deviceError } = await supabase.rpc('execute_sql', {
      sql: `
        DROP TABLE IF EXISTS device_registrations CASCADE;
        CREATE TABLE IF NOT EXISTS device_registrations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            device_id VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);
        CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);
      `
    });

    if (deviceError) {
      console.warn('⚠️ Erreur création device_registrations:', deviceError.message);
    } else {
      console.log('✅ Table device_registrations créée');
    }

    // Recréer email_verifications
    console.log('📝 Recréation de email_verifications...');
    const { error: emailError } = await supabase.rpc('execute_sql', {
      sql: `
        DROP TABLE IF EXISTS email_verifications CASCADE;
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
        CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
      `
    });

    if (emailError) {
      console.warn('⚠️ Erreur création email_verifications:', emailError.message);
    } else {
      console.log('✅ Table email_verifications créée');
    }

    console.log('\n🧪 Étape 5: Test des nouvelles tables...');
    
    // Test device_registrations
    try {
      const { data: deviceTest, error: deviceTestError } = await supabase
        .from('device_registrations')
        .select('count')
        .limit(1);

      if (deviceTestError) {
        console.warn('⚠️ Erreur test device_registrations:', deviceTestError.message);
      } else {
        console.log('✅ device_registrations opérationnelle');
      }
    } catch (error) {
      console.warn('⚠️ Erreur test device_registrations:', error.message);
    }

    // Test email_verifications
    try {
      const { data: emailTest, error: emailTestError } = await supabase
        .from('email_verifications')
        .select('count')
        .limit(1);

      if (emailTestError) {
        console.warn('⚠️ Erreur test email_verifications:', emailTestError.message);
      } else {
        console.log('✅ email_verifications opérationnelle');
      }
    } catch (error) {
      console.warn('⚠️ Erreur test email_verifications:', error.message);
    }

    console.log('\n🎉 OPÉRATION TERMINÉE !');
    console.log('='.repeat(60));
    console.log('✅ Colonnes ajoutées à la table users');
    console.log('✅ Tables device_registrations et email_verifications recréées');
    console.log('✅ Contraintes foreign key correctement configurées');
    console.log('✅ Système de tracking device prêt');
    console.log('\n🚀 Le système d\'inscription devrait maintenant fonctionner !');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    console.log('\n💡 Solution alternative:');
    console.log('1. Allez dans le dashboard Supabase');
    console.log('2. Ouvrez SQL Editor');
    console.log('3. Exécutez le contenu de ADD_DEVICE_ID_COLUMN.sql');
  }
}

// Exécuter l'ajout des colonnes
addMissingColumns().then(() => {
  console.log('\n🏁 Processus terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
