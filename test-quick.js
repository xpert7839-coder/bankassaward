// 🧪 TEST RAPIDE
async function quickTest() {
  try {
    const response = await fetch('http://localhost:3001/api/users');
    console.log('Status:', response.status);
    if (response.ok) {
      const users = await response.json();
      console.log('✅ API fonctionne -', users.length, 'utilisateurs');
    } else {
      console.log('❌ Erreur API');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

quickTest();
