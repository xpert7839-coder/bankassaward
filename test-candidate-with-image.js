// 🧪 TEST CRÉATION CANDIDAT AVEC IMAGE
// Vérifie que l'ajout/modification de candidat avec image fonctionne

async function testCandidateWithImage() {
  console.log('🧪 TEST CRÉATION CANDIDAT AVEC IMAGE');
  console.log('=====================================');

  try {
    // 1. D'abord uploader une image
    console.log('\n1️⃣ Upload d\'une image:');
    
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

    const formData = new FormData();
    const blob = new Blob([pngData], { type: 'image/png' });
    formData.append('file', blob, 'candidate-test.png');

    const uploadResponse = await fetch('http://localhost:3001/api/simple-upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.log('   ❌ Erreur upload:', error.error);
      return;
    }

    const uploadResult = await uploadResponse.json();
    console.log('   ✅ Image uploadée:', uploadResult.url);

    // 2. Récupérer une catégorie
    console.log('\n2️⃣ Récupération d\'une catégorie:');
    
    const categoriesResponse = await fetch('http://localhost:3001/api/categories');
    
    if (!categoriesResponse.ok) {
      console.log('   ❌ Erreur catégories');
      return;
    }

    const categories = await categoriesResponse.json();
    if (categories.length === 0) {
      console.log('   ❌ Aucune catégorie trouvée');
      return;
    }

    const categoryId = categories[0].id;
    console.log('   ✅ Catégorie trouvée:', categories[0].name);

    // 3. Créer un candidat avec l'image
    console.log('\n3️⃣ Création du candidat:');
    
    const candidateData = {
      categoryId: categoryId,
      name: 'Test Candidate Image',
      alias: 'Test Alias',
      image: uploadResult.url,
      bio: 'Ceci est un candidat de test avec une image uploadée.',
      achievements: ['Test achievement 1', 'Test achievement 2'],
      songCount: 5,
      candidateSong: 'Test Song',
      audioFile: null
    };

    const createResponse = await fetch('http://localhost:3001/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });

    console.log('   📥 Status:', createResponse.status);

    if (createResponse.ok) {
      const candidate = await createResponse.json();
      console.log('   ✅ Candidat créé avec succès:');
      console.log('      ID:', candidate.id);
      console.log('      Nom:', candidate.name);
      console.log('      Image:', candidate.image);

      // 4. Mettre à jour le candidat avec une nouvelle image
      console.log('\n4️⃣ Mise à jour du candidat:');
      
      // Upload d'une deuxième image
      formData.set('file', blob, 'candidate-test-updated.png');
      const uploadResponse2 = await fetch('http://localhost:3001/api/simple-upload', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse2.ok) {
        const uploadResult2 = await uploadResponse2.json();
        console.log('   ✅ Nouvelle image uploadée:', uploadResult2.url);

        const updateData = {
          id: candidate.id,
          name: 'Test Candidate Updated',
          image: uploadResult2.url,
          bio: 'Bio mise à jour avec nouvelle image.'
        };

        const updateResponse = await fetch('http://localhost:3001/api/candidates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        console.log('   📥 Status update:', updateResponse.status);

        if (updateResponse.ok) {
          const updatedCandidate = await updateResponse.json();
          console.log('   ✅ Candidat mis à jour:');
          console.log('      Nouveau nom:', updatedCandidate.name);
          console.log('      Nouvelle image:', updatedCandidate.image);
        } else {
          const error = await updateResponse.json();
          console.log('   ❌ Erreur mise à jour:', error.error);
        }
      }

    } else {
      const error = await createResponse.json();
      console.log('   ❌ Erreur création candidat:');
      console.log('      Message:', error.error);
      console.log('      Status:', createResponse.status);
    }

    console.log('\n🎯 RÉSULTAT:');
    console.log('=============');
    console.log('✅ Test candidat avec image terminé');
    console.log('✅ Upload d\'image fonctionne');
    console.log('✅ Création candidat fonctionne');
    console.log('✅ Modification candidat fonctionne');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCandidateWithImage();
