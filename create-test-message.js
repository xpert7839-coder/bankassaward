// Créer un message admin de test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestMessage() {
  try {
    console.log('📝 Création d\'un message admin de test...');
    
    const testMessage = {
      title: '🎉 BKSS Awards 2026 - Ouverture des votes !',
      message: 'Les votes sont maintenant ouverts pour toutes les catégories. Participez massivement et faites entendre votre voix ! Les résultats seront annoncés lors de la cérémonie officielle.',
      type: 'success'
    };
    
    const { data, error } = await supabase
      .from('admin_messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur création message:', error.message);
      return;
    }
    
    console.log('✅ Message admin créé avec succès !');
    console.log(`📋 Titre: ${data.title}`);
    console.log(`📝 Message: ${data.message.substring(0, 100)}...`);
    console.log(`🎨 Type: ${data.type}`);
    console.log(`👥 Cible: ${data.target_users}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTestMessage();
