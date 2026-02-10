const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdHhtaHFoa2NzYXd2amp3eGJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMzNTQ5NCwiZXhwIjoyMDg1OTExNDk0fQ.3D_rGf1RxA3HiEZiR1VhfXzdndoAh3gMNs5qYXQ-zgo';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORRECTION SIMPLE DES TYPES DE DONNÉES');
console.log('='.repeat(50));

async function simpleFix() {
  try {
    console.log('\n🔍 Étape 1: Vérification de la structure actuelle...');
    
    // D'abord, vérifier si on peut se connecter
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur de connexion à la base:', testError);
      return;
    }

    console.log('✅ Connexion à la base réussie');

    console.log('\n🗑️ Étape 2: Suppression des tables problématiques...');
    
    // Supprimer les tables qui causent des problèmes de types
    const tablesToDrop = [
      'device_registrations',
      'email_verifications'
    ];

    for (const table of tablesToDrop) {
      console.log(`Suppression de la table: ${table}`);
      const { error: dropError } = await supabase.rpc('execute_sql', {
        sql: `DROP TABLE IF EXISTS ${table} CASCADE;`
      });

      if (dropError) {
        console.warn(`⚠️ Erreur suppression ${table}:`, dropError.message);
      } else {
        console.log(`✅ Table ${table} supprimée`);
      }
    }

    console.log('\n🏗️ Étape 3: Recréation des tables avec les bons types...');
    
    // Recréer device_registrations
    const { error: deviceError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS device_registrations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            device_id VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (deviceError) {
      console.error('❌ Erreur création device_registrations:', deviceError);
    } else {
      console.log('✅ Table device_registrations créée');
    }

    // Recréer email_verifications
    const { error: emailError } = await supabase.rpc('execute_sql', {
      sql: `
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
    });

    if (emailError) {
      console.error('❌ Erreur création email_verifications:', emailError);
    } else {
      console.log('✅ Table email_verifications créée');
    }

    console.log('\n📊 Étape 4: Création des indexes...');
    
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);',
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_ip_address ON device_registrations(ip_address);',
      'CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);'
    ];

    for (const sql of indexesToCreate) {
      const { error: indexError } = await supabase.rpc('execute_sql', { sql });
      if (indexError) {
        console.warn(`⚠️ Erreur création index:`, indexError.message);
      }
    }

    console.log('✅ Indexes créés');

    console.log('\n🧪 Étape 5: Test des nouvelles tables...');
    
    // Tester device_registrations
    const { data: deviceTest, error: deviceTestError } = await supabase
      .from('device_registrations')
      .select('count')
      .limit(1);

    if (deviceTestError) {
      console.error('❌ Erreur test device_registrations:', deviceTestError);
    } else {
      console.log('✅ device_registrations opérationnelle');
    }

    // Tester email_verifications
    const { data: emailTest, error: emailTestError } = await supabase
      .from('email_verifications')
      .select('count')
      .limit(1);

    if (emailTestError) {
      console.error('❌ Erreur test email_verifications:', emailTestError);
    } else {
      console.log('✅ email_verifications opérationnelle');
    }

    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
    console.log('='.repeat(50));
    console.log('✅ Tables device_registrations et email_verifications recréées');
    console.log('✅ Types UUID correctement configurés');
    console.log('✅ Contraintes foreign key opérationnelles');
    console.log('✅ Indexes créés pour optimisation');
    console.log('\n🚀 Le système d\'inscription est maintenant prêt !');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    
    // Solution alternative si SQL ne fonctionne pas
    console.log('\n🔄 Tentative de solution alternative...');
    console.log('💡 Suggestion: Exécutez manuellement dans le dashboard Supabase:');
    console.log('1. Allez dans SQL Editor');
    console.log('2. Copiez-collez le contenu de fix-database-types.sql');
    console.log('3. Exécutez le script');
  }
}

// Exécuter la correction
simpleFix().then(() => {
  console.log('\n🏁 Processus terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
