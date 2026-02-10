// Script pour vérifier la table voting_config
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifierTable() {
  console.log('🔍 VÉRIFICATION DE LA TABLE voting_config');
  console.log('==========================================');

  try {
    // 1. Vérifier si la table existe
    console.log('\n1️⃣ Vérification de l\'existence de la table...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'voting_config');

    if (tablesError) {
      console.error('❌ Erreur vérification table:', tablesError);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Table voting_config existe');
    } else {
      console.log('❌ Table voting_config n\'existe pas');
      console.log('💡 Solution: Exécutez le SQL de création');
      return;
    }

    // 2. Vérifier la structure de la table
    console.log('\n2️⃣ Vérification de la structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'voting_config')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erreur vérification colonnes:', columnsError);
      return;
    }

    console.log('📋 Colonnes trouvées:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Vérifier les données actuelles
    console.log('\n3️⃣ Vérification des données actuelles...');
    const { data: configData, error: dataError } = await supabase
      .from('voting_config')
      .select('*');

    if (dataError) {
      console.error('❌ Erreur lecture données:', dataError);
      return;
    }

    if (configData && configData.length > 0) {
      console.log('✅ Données trouvées:');
      configData.forEach(row => {
        console.log('📊 Configuration:');
        console.log(`  ID: ${row.id}`);
        console.log(`  Event: ${row.current_event}`);
        console.log(`  Votes ouverts: ${row.is_voting_open}`);
        console.log(`  Message: ${row.block_message}`);
        console.log(`  Créé le: ${row.created_at}`);
        console.log(`  Mis à jour le: ${row.updated_at}`);
        console.log('---');
      });
    } else {
      console.log('❌ Aucune donnée trouvée dans voting_config');
      console.log('💡 Solution: Insérez une configuration par défaut');
    }

    // 4. Test d'écriture
    console.log('\n4️⃣ Test d\'écriture...');
    const testData = {
      id: 'main',
      current_event: 'Test Event',
      is_voting_open: true,
      block_message: 'Test de message',
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('voting_config')
      .upsert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erreur écriture:', insertError);
      console.log('💡 Détails:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Écriture réussie:');
      console.log('📊 Données insérées:', insertData);
    }

    // 5. Vérification finale
    console.log('\n5️⃣ Vérification finale...');
    const { data: finalData, error: finalError } = await supabase
      .from('voting_config')
      .select('*')
      .eq('id', 'main')
      .single();

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log('✅ Configuration finale:');
      console.log('📊 État actuel:', finalData);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }

  console.log('\n🎯 RÉSULTATS:');
  console.log('==========================================');
  console.log('Si tous les tests sont ✅, alors la table fonctionne correctement.');
  console.log('Si certains tests sont ❌, alors il y a un problème à corriger.');
}

// Exécuter la vérification
verifierTable();
