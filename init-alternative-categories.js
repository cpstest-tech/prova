#!/usr/bin/env node

import db from './server/config/database.js';
import { AlternativeCategory } from './server/models/AlternativeCategory.js';

console.log('🔄 Inizializzazione categorie alternative predefinite...');

const defaultCategories = [
  {
    name: 'SSD NVMe 500GB',
    description: 'SSD NVMe da 500GB per prestazioni elevate',
    component_type: 'Storage'
  },
  {
    name: 'SSD NVMe 1TB',
    description: 'SSD NVMe da 1TB per prestazioni elevate',
    component_type: 'Storage'
  },
  {
    name: 'SSD SATA 500GB',
    description: 'SSD SATA da 500GB per budget limitati',
    component_type: 'Storage'
  },
  {
    name: 'SSD SATA 1TB',
    description: 'SSD SATA da 1TB per budget limitati',
    component_type: 'Storage'
  },
  {
    name: 'RAM DDR4 16GB',
    description: 'Memoria DDR4 da 16GB per gaming e workstation',
    component_type: 'RAM'
  },
  {
    name: 'RAM DDR4 32GB',
    description: 'Memoria DDR4 da 32GB per workstation e content creation',
    component_type: 'RAM'
  },
  {
    name: 'RAM DDR5 16GB',
    description: 'Memoria DDR5 da 16GB per nuove piattaforme',
    component_type: 'RAM'
  },
  {
    name: 'RAM DDR5 32GB',
    description: 'Memoria DDR5 da 32GB per nuove piattaforme',
    component_type: 'RAM'
  },
  {
    name: 'PSU 650W',
    description: 'Alimentatore 650W per build mid-range',
    component_type: 'PSU'
  },
  {
    name: 'PSU 750W',
    description: 'Alimentatore 750W per build high-end',
    component_type: 'PSU'
  },
  {
    name: 'PSU 850W',
    description: 'Alimentatore 850W per build enthusiast',
    component_type: 'PSU'
  },
  {
    name: 'Case Mid Tower',
    description: 'Case Mid Tower per la maggior parte delle build',
    component_type: 'Case'
  },
  {
    name: 'Case Full Tower',
    description: 'Case Full Tower per build high-end',
    component_type: 'Case'
  },
  {
    name: 'Motherboard B450/B550',
    description: 'Motherboard AMD B450/B550 per gaming',
    component_type: 'Motherboard'
  },
  {
    name: 'Motherboard X570/X670',
    description: 'Motherboard AMD X570/X670 per workstation',
    component_type: 'Motherboard'
  },
  {
    name: 'Motherboard Z690/Z790',
    description: 'Motherboard Intel Z690/Z790 per gaming e workstation',
    component_type: 'Motherboard'
  },
  {
    name: 'Cooler Air Budget',
    description: 'Dissipatore ad aria per budget limitati',
    component_type: 'Cooler'
  },
  {
    name: 'Cooler Air Premium',
    description: 'Dissipatore ad aria premium per overclock',
    component_type: 'Cooler'
  },
  {
    name: 'Cooler AIO 240mm',
    description: 'Dissipatore AIO 240mm per raffreddamento liquido',
    component_type: 'Cooler'
  },
  {
    name: 'Cooler AIO 360mm',
    description: 'Dissipatore AIO 360mm per raffreddamento liquido premium',
    component_type: 'Cooler'
  }
];

async function initCategories() {
  try {
    let created = 0;
    
    for (const categoryData of defaultCategories) {
      try {
        // Controlla se la categoria esiste già
        const existing = db.prepare('SELECT id FROM alternative_categories WHERE name = ?').get(categoryData.name);
        
        if (!existing) {
          const id = AlternativeCategory.create(categoryData);
          console.log(`✅ Creata categoria: ${categoryData.name}`);
          created++;
        } else {
          console.log(`ℹ️  Categoria già esistente: ${categoryData.name}`);
        }
      } catch (error) {
        console.error(`❌ Errore creazione categoria ${categoryData.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Inizializzazione completata!`);
    console.log(`📊 Categorie create: ${created}`);
    console.log(`📊 Categorie esistenti: ${defaultCategories.length - created}`);
    
    // Mostra statistiche finali
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM alternative_categories').get();
    const totalAlternatives = db.prepare('SELECT COUNT(*) as count FROM component_alternatives').get();
    
    console.log(`\n📈 Statistiche finali:`);
    console.log(`  Totale categorie: ${totalCategories.count}`);
    console.log(`  Totale alternative: ${totalAlternatives.count}`);
    
  } catch (error) {
    console.error('\n❌ Errore durante l\'inizializzazione:', error.message);
    process.exit(1);
  }
}

initCategories();
