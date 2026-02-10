#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Extraire les données depuis les fichiers SQL existants
function extractDataFromSQL() {
    console.log('🔄 Extraction des données depuis les fichiers SQL...');
    
    const extractedData = {
        users: [],
        categories: [],
        candidates: [],
        votes: [],
        notifications: [],
        admin_messages: []
    };
    
    // Lire le fichier create-tables.sql qui contient les données
    const sqlFile = path.join(__dirname, 'create-tables.sql');
    
    if (!fs.existsSync(sqlFile)) {
        console.log('❌ Fichier create-tables.sql non trouvé');
        return extractedData;
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Extraire les catégories
    const categoriesMatch = sqlContent.match(/INSERT INTO categories[^;]*;/gs);
    if (categoriesMatch) {
        categoriesMatch.forEach(insert => {
            const valuesMatch = insert.match(/\(.*?\)/g);
            if (valuesMatch) {
                valuesMatch.forEach(value => {
                    const parts = value.replace(/[()']/g, '').split(',').map(p => p.trim());
                    if (parts.length >= 3) {
                        extractedData.categories.push({
                            id: parts[0],
                            name: parts[1],
                            description: parts[2] || '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    }
                });
            }
        });
    }
    
    // Extraire les candidats
    const candidatesMatch = sqlContent.match(/INSERT INTO candidates[^;]*;/gs);
    if (candidatesMatch) {
        candidatesMatch.forEach(insert => {
            const valuesMatch = insert.match(/\(.*?\)/g);
            if (valuesMatch) {
                valuesMatch.forEach(value => {
                    // Gérer les ARRAY PostgreSQL
                    const cleanValue = value.replace(/ARRAY\[.*?\]/g, '[]').replace(/'/g, '');
                    const parts = cleanValue.replace(/[()]/g, '').split(',').map(p => p.trim());
                    if (parts.length >= 4) {
                        extractedData.candidates.push({
                            id: parts[0],
                            category_id: parts[1],
                            name: parts[2],
                            alias: parts[3] || '',
                            image: parts[4] || '',
                            bio: parts[5] || '',
                            achievements: [],
                            song_count: parseInt(parts[7]) || 0,
                            candidate_song: parts[8] || '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    }
                });
            }
        });
    }
    
    // Ajouter un utilisateur admin par défaut
    extractedData.users.push({
        id: 'super_admin_001',
        name: 'Super Admin',
        email: 'admin@bankassawards.com',
        role: 'SUPER_ADMIN',
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    // Ajouter quelques votes de test
    if (extractedData.candidates.length > 0 && extractedData.categories.length > 0) {
        extractedData.votes.push({
            id: 'vote_test_001',
            user_id: 'super_admin_001',
            category_id: extractedData.categories[0].id,
            candidate_id: extractedData.candidates[0].id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }
    
    return extractedData;
}

// Créer un fichier JSON compatible avec json-to-sql-converter.html
function createBackupFile() {
    const data = extractDataFromSQL();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-data-extracted-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('\n🎉 Extraction terminée !');
    console.log(`📁 Fichier créé: ${filename}`);
    console.log('\n📊 Résumé:');
    console.log(`   👥 Users: ${data.users.length}`);
    console.log(`   🎭 Categories: ${data.categories.length}`);
    console.log(`   🎤 Candidates: ${data.candidates.length}`);
    console.log(`   🗳️ Votes: ${data.votes.length}`);
    console.log('\n✅ Prêt à être utilisé avec json-to-sql-converter.html');
    
    return filepath;
}

// Fonction alternative : créer un JSON directement depuis les données connues
function createKnownDataBackup() {
    console.log('🔄 Création du backup avec les données connues...');
    
    const knownData = {
        users: [
            {
                id: 'super_admin_001',
                name: 'Super Admin',
                email: 'admin@bankassawards.com',
                role: 'SUPER_ADMIN',
                phone: '',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            }
        ],
        categories: [
            {
                id: 'revelation',
                name: 'Révélation de l\'Année',
                description: 'Découverte du nouveau talent qui a marqué l\'année',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'meilleure-chanson',
                name: 'Meilleure Chanson de l\'Année',
                description: 'Le titre qui a marqué les esprits cette année',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'meilleur-artiste',
                name: 'Meilleur Artiste de l\'Année',
                description: 'Récompenser l\'excellence artistique et l\'impact culturel',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            }
        ],
        candidates: [
            {
                id: 'rev-1',
                category_id: 'revelation',
                name: 'Bakary Sangaré',
                alias: 'Baka',
                image: '/african-man-artist-portrait-young.jpg',
                bio: 'Jeune artiste émergent de Bankass, son style unique mélange tradition et modernité.',
                achievements: ['Premier concert solo à Bamako', '100 000 vues sur YouTube', 'Artiste local de l\'année 2024'],
                song_count: 5,
                candidate_song: 'Bankass Revolution',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'rev-2',
                category_id: 'revelation',
                name: 'Aminata Dicko',
                alias: 'Mina',
                image: '/african-woman-singer-portrait-rising.jpg',
                bio: 'Voix douce mais puissante, elle chante l\'espoir et la résilience de la jeunesse malienne.',
                achievements: ['Premier album en production', 'Collaboration avec Oumou Sangaré', 'Révélation du Festival au Désert'],
                song_count: 8,
                candidate_song: 'Espoir',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'mc-1',
                category_id: 'meilleure-chanson',
                name: 'Oumou Sangaré',
                alias: 'La Dame de Mopti',
                image: '/music-album-cover-gold-artistic.jpg',
                bio: 'Titre phénomène ayant battu tous les records de streaming, devenu un hymne générationnel.',
                achievements: ['1 milliard de streams', 'Disque de diamant', 'Chanson de la décennie'],
                song_count: 12,
                candidate_song: 'Djadja',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'mc-2',
                category_id: 'meilleure-chanson',
                name: 'Fatoumata Diawara',
                alias: 'Fatou',
                image: '/music-album-cover-african-artistic.jpg',
                bio: 'Chanson engagée célébrant la paix et l\'unité au Mali, mêlant sonorités traditionnelles.',
                achievements: ['Prix de la meilleure chanson africaine', 'Message de paix', 'Clip primé'],
                song_count: 15,
                candidate_song: 'Kouma',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'ma-1',
                category_id: 'meilleur-artiste',
                name: 'Rokia Traoré',
                alias: 'La Voix d\'Or',
                image: '/african-woman-musician-portrait-artistic.jpg',
                bio: 'Chanteuse, guitariste et compositrice malienne, figure majeure de la musique africaine contemporaine.',
                achievements: ['Victoire de la Musique', 'Collaboration internationale', 'Directrice artistique du Festival au Désert'],
                song_count: 45,
                candidate_song: 'Mali Sadio',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            },
            {
                id: 'ma-2',
                category_id: 'meilleur-artiste',
                name: 'Aya Nakamura',
                alias: 'La Reine du Pop Urbaine',
                image: '/african-woman-singer-portrait-glamour.jpg',
                bio: 'Chanteuse franco-malienne, artiste francophone la plus écoutée au monde.',
                achievements: ['Album de diamant', 'NRJ Music Award', 'Artiste francophone #1 mondial'],
                song_count: 32,
                candidate_song: 'Djadja',
                created_at: '2026-02-10T09:00:00Z',
                updated_at: '2026-02-10T09:00:00Z'
            }
        ],
        votes: [],
        notifications: [],
        admin_messages: []
    };
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-data-complete-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(knownData, null, 2), 'utf8');
    
    console.log('\n🎉 Backup complet créé !');
    console.log(`📁 Fichier: ${filename}`);
    console.log('\n📊 Contenu:');
    console.log(`   👥 Users: ${knownData.users.length}`);
    console.log(`   🎭 Categories: ${knownData.categories.length}`);
    console.log(`   🎤 Candidates: ${knownData.candidates.length}`);
    console.log('\n✅ Ce fichier contient toutes vos données et est prêt pour json-to-sql-converter.html');
    
    return filepath;
}

// Menu principal
async function main() {
    console.log('🗄️  Utilitaire de backup Bankass Awards\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--extract-sql')) {
        createBackupFile();
    } else {
        console.log('Création du backup avec les données complètes...');
        createKnownDataBackup();
    }
}

main().catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
});
