#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase depuis .env.local
const supabaseUrl = 'https://ilfsbpuyvisyfztqrccg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM';

// Initialiser le client Supabase avec les droits d'admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour exporter toutes les données
async function exportAllData() {
    console.log('🔄 Début de l\'export des données depuis Supabase...');
    
    const exportData = {
        export_date: new Date().toISOString(),
        project: 'Bankass Awards',
        tables: {}
    };
    
    // Liste des tables à exporter
    const tables = [
        'users',
        'categories', 
        'candidates',
        'votes',
        'notifications',
        'admin_messages',
        'voting_config',
        'app_settings',
        'leadership_prizes',
        'device_registrations',
        'email_verifications'
    ];
    
    let totalRecords = 0;
    
    for (const tableName of tables) {
        try {
            console.log(`📥 Export de la table: ${tableName}`);
            
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*');
            
            if (error) {
                console.log(`⚠️  Table ${tableName}: ${error.message}`);
                exportData.tables[tableName] = {
                    error: error.message,
                    data: []
                };
            } else {
                const recordCount = data ? data.length : 0;
                console.log(`✅ ${tableName}: ${recordCount} enregistrements`);
                
                exportData.tables[tableName] = {
                    count: recordCount,
                    data: data || []
                };
                
                totalRecords += recordCount;
            }
        } catch (err) {
            console.log(`❌ Erreur table ${tableName}:`, err.message);
            exportData.tables[tableName] = {
                error: err.message,
                data: []
            };
        }
    }
    
    // Ajouter un résumé
    exportData.summary = {
        total_tables: tables.length,
        total_records: totalRecords,
        export_success: true
    };
    
    // Générer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `supabase-export-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    // Sauvegarder le fichier JSON
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');
    
    console.log('\n🎉 Export terminé !');
    console.log(`📁 Fichier sauvegardé: ${filename}`);
    console.log(`📊 Total enregistrements: ${totalRecords}`);
    
    // Afficher le résumé par table
    console.log('\n📋 Résumé par table:');
    for (const [tableName, tableData] of Object.entries(exportData.tables)) {
        if (tableData.error) {
            console.log(`   ❌ ${tableName}: ERREUR - ${tableData.error}`);
        } else {
            console.log(`   ✅ ${tableName}: ${tableData.count} enregistrements`);
        }
    }
    
    return filepath;
}

// Fonction pour exporter uniquement les données principales (format compatible avec json-to-sql-converter.html)
async function exportMainData() {
    console.log('🔄 Export des données principales pour json-to-sql-converter.html...');
    
    const mainData = {
        users: [],
        categories: [],
        candidates: [],
        votes: [],
        notifications: [],
        admin_messages: []
    };
    
    const tables = ['users', 'categories', 'candidates', 'votes', 'notifications', 'admin_messages'];
    
    for (const tableName of tables) {
        try {
            console.log(`📥 Export de: ${tableName}`);
            const { data, error } = await supabase.from(tableName).select('*');
            
            if (error) {
                console.log(`⚠️  ${tableName}: ${error.message}`);
            } else {
                mainData[tableName] = data || [];
                console.log(`✅ ${tableName}: ${mainData[tableName].length} enregistrements`);
            }
        } catch (err) {
            console.log(`❌ Erreur ${tableName}:`, err.message);
        }
    }
    
    // Sauvegarder au format compatible
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-data-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(mainData, null, 2), 'utf8');
    
    console.log(`\n✅ Fichier compatible créé: ${filename}`);
    console.log('📋 Prêt à être utilisé avec json-to-sql-converter.html');
    
    return filepath;
}

// Menu principal
async function main() {
    console.log('🗄️  Utilitaire d\'export Supabase - Bankass Awards\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--main-only')) {
        await exportMainData();
    } else if (args.includes('--all')) {
        await exportAllData();
    } else {
        console.log('Usage:');
        console.log('  node export-data-from-supabase.js --all      # Exporter toutes les tables');
        console.log('  node export-data-from-supabase.js --main-only # Exporter tables principales (compatible json-to-sql-converter)');
        console.log('');
        console.log('Exécution par défaut: export des données principales...');
        await exportMainData();
    }
}

// Gérer les erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

main().catch(err => {
    console.error('❌ Erreur lors de l\'export:', err);
    process.exit(1);
});
