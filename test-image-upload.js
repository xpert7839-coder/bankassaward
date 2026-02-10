// 🧪 TEST D'UPLOAD D'IMAGE
// Vérifie que l'API d'upload fonctionne correctement

async function testImageUpload() {
  console.log('🧪 TEST D\'UPLOAD D\'IMAGE');
  console.log('==========================');

  try {
    // Créer une image de test simple (PNG 1x1 pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00,
      0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
      0xAE, 0x42, 0x60, 0x82
    ]);

    console.log('\n1️⃣ Test upload fichier image:');
    
    const formData = new FormData();
    const blob = new Blob([pngData], { type: 'image/png' });
    formData.append('file', blob, 'test-candidate-image.png');

    console.log('   📸 Envoi du fichier...');
    console.log('   📏 Taille:', pngData.length, 'bytes');
    console.log('   🏷️ Type:', 'image/png');

    const response = await fetch('http://localhost:3001/api/simple-upload', {
      method: 'POST',
      body: formData
    });

    console.log('   📥 Status:', response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Upload réussi:');
      console.log('      URL:', result.url);
      console.log('      Success:', result.success);
      
      // Vérifier que l'URL est accessible
      console.log('\n2️⃣ Test accès à l\'image:');
      
      try {
        const imageResponse = await fetch(result.url);
        console.log('   📥 Status image:', imageResponse.status);
        
        if (imageResponse.ok) {
          console.log('   ✅ Image accessible');
          console.log('   📏 Taille image:', imageResponse.headers.get('content-length'), 'bytes');
        } else {
          console.log('   ❌ Image inaccessible');
        }
      } catch (error) {
        console.log('   ❌ Erreur accès image:', error.message);
      }

    } else {
      const error = await response.json();
      console.log('   ❌ Erreur upload:');
      console.log('      Message:', error.error);
      console.log('      Status:', response.status);
      
      if (response.status === 500) {
        console.log('   🔴 Erreur serveur - vérifier les logs');
      }
    }

    console.log('\n🎯 RÉSULTAT:');
    console.log('=============');
    console.log('✅ Test d\'upload terminé');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testImageUpload();
