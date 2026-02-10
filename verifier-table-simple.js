// Script simple pour vérifier la table voting_config
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifierTableSimple() {
  console.log('🔍 VÉRIFICATION SIMPLE DE voting_config');
  console.log('=========================================');

  try {
    // 1. Tenter de lire les données
    console.log('\n📊 Tentative de lecture des données...');
    const { data: configData, error: readError } = await supabase
      .from('voting_config')
      .select('*');

    if (readError) {
      console.error('❌ Erreur lecture - Table probablement inexistante:');
      console.log('Code:', readError.code);
      console.log('Message:', readError.message);
      
      if (readError.code === 'PGRST116') {
        console.log('\n💡 DIAGNOSTIC: La table voting_config n\'existe pas!');
        console.log('🔧 SOLUTION: Créez la table avec ce SQL:');
        console.log(`
-- Créer la table voting_config
CREATE TABLE IF NOT EXISTS voting_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    current_event TEXT,
    is_voting_open BOOLEAN DEFAULT false,
    block_message TEXT DEFAULT 'Les votes sont actuellement fermés.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer une configuration par défaut
INSERT INTO voting_config (id, current_event, is_voting_open, block_message)
VALUES (
    'main',
    NULL,
    false,
    'Votes temporairement indisponible. Les votes sont actuellement fermés. Ils seront ouverts très bientôt. Pour plus d''information contactez le 70359104 (WhatsApp)'
)
ON CONFLICT (id) DO NOTHING;
        `);
      }
      return;
    }

    console.log('✅ Lecture réussie - Table existe');
    console.log('📊 Données trouvées:', configData?.length || 0, 'enregistrement(s)');

    if (configData && configData.length > 0) {
      configData.forEach((row, index) => {
        console.log(`\n📋 Enregistrement ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Event: ${row.current_event || 'NULL'}`);
        console.log(`  Votes ouverts: ${row.is_voting_open}`);
        console.log(`  Message: ${row.block_message || 'NULL'}`);
        console.log(`  Créé le: ${row.created_at}`);
        console.log(`  Mis à jour: ${row.updated_at}`);
      });
    }

    // 2. Test d'écriture
    console.log('\n✏️ Test d\'écriture...');
    const testData = {
      id: 'main',
      current_event: 'Test Verification',
      is_voting_open: true,
      block_message: 'Test d\'écriture - ' + new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: writeData, error: writeError } = await supabase
      .from('voting_config')
      .upsert(testData)
      .select()
      .single();

    if (writeError) {
      console.error('❌ Erreur écriture:');
      console.log('Code:', writeError.code);
      console.log('Message:', writeError.message);
      console.log('Détails:', writeError.details);
    } else {
      console.log('✅ Écriture réussie!');
      console.log('📊 Données écrites:', writeData);
    }

    // 3. Vérification finale
    console.log('\n🔄 Vérification finale...');
    const { data: finalData, error: finalError } = await supabase
      .from('voting_config')
      .select('*')
      .eq('id', 'main')
      .single();

    if (finalError) {
      console.error('❌ Erreur lecture finale:', finalError);
    } else {
      console.log('✅ Configuration finale:');
      console.log('📊 État actuel:', finalData);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('=========================================');
  console.log('Si vous voyez "✅" partout, la table fonctionne correctement.');
  console.log('Si vous voyez "❌", il faut créer ou réparer la table.');
}

// Exécuter la vérification
verifierTableSimple();
