
// 📥 SCRIPT D'IMPORT POUR LA BASE LOCALE
// Généré automatiquement depuis l'export Supabase

const { getLocalDatabase } = require('./lib/local-db')
const fs = require('fs').promises
const path = require('path')

async function importFromExport() {
  console.log('📥 Import des données depuis les fichiers d'export')
  
  const localDb = await getLocalDatabase()
  const exportDir = path.join(__dirname, 'exports')
  
  try {
    // Import des utilisateurs
    console.log('\n👥 Import des utilisateurs...')
    const usersData = await fs.readFile(path.join(exportDir, 'users.json'), 'utf8')
    const users = JSON.parse(usersData)
    
    for (const user of users) {
      try {
        await localDb.insertUser({
          name: user.name,
          email: user.email,
          password: user.password,
          domain: user.domain,
          city: user.city,
          phone: user.phone,
          role: user.role,
          device_id: user.device_id,
          registration_ip: user.registration_ip,
          user_agent: user.user_agent,
          email_verified: user.email_verified
        })
        console.log(`   ✅ Utilisateur importé: ${user.email}`)
      } catch (error) {
        console.log(`   ⚠️ Erreur import utilisateur ${user.email}:`, error.message)
      }
    }
    
    // Import des catégories
    console.log('\n📁 Import des catégories...')
    const categoriesData = await fs.readFile(path.join(exportDir, 'categories.json'), 'utf8')
    const categories = JSON.parse(categoriesData)
    
    for (const category of categories) {
      try {
        // Implémenter insertCategory dans LocalDatabase
        console.log(`   📁 Catégorie: ${category.name}`)
      } catch (error) {
        console.log(`   ⚠️ Erreur import catégorie ${category.name}:`, error.message)
      }
    }
    
    // Import des candidats
    console.log('\n🎭 Import des candidats...')
    const candidatesData = await fs.readFile(path.join(exportDir, 'candidates.json'), 'utf8')
    const candidates = JSON.parse(candidatesData)
    
    for (const candidate of candidates) {
      try {
        // Implémenter insertCandidate dans LocalDatabase
        console.log(`   🎭 Candidat: ${candidate.name}`)
      } catch (error) {
        console.log(`   ⚠️ Erreur import candidat ${candidate.name}:`, error.message)
      }
    }
    
    // Import des votes
    console.log('\n🗳️ Import des votes...')
    const votesData = await fs.readFile(path.join(exportDir, 'votes.json'), 'utf8')
    const votes = JSON.parse(votesData)
    
    for (const vote of votes) {
      try {
        // Implémenter insertVote dans LocalDatabase
        console.log(`   🗳️ Vote: ${vote.user_id}`)
      } catch (error) {
        console.log(`   ⚠️ Erreur import vote ${vote.id}:`, error.message)
      }
    }
    
    console.log('\n🎉 Import terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors de l'import:', error)
  } finally {
    await localDb.close()
  }
}

if (require.main === module) {
  importFromExport()
}

module.exports = { importFromExport }
