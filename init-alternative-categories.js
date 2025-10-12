import { AlternativeCategory } from './server/models/AlternativeCategory.js';
import ComponentAlternatives from './server/utils/componentAlternatives.js';

async function initializeAlternativeCategories() {
  console.log('🔄 Inizializzazione categorie alternative...');

  // Categorie predefinite
  const defaultCategories = [
    {
      name: 'SSD NVMe 500GB',
      description: 'Alternative SSD NVMe da 500GB per gaming e uso generale',
      component_type: 'Storage'
    },
    {
      name: 'RAM DDR4 16GB',
      description: 'Kit RAM DDR4 16GB (2x8GB) per gaming e workstation',
      component_type: 'RAM'
    },
    {
      name: 'PSU 650W 80+ Gold',
      description: 'Alimentatori 650W certificati 80+ Gold per build gaming',
      component_type: 'PSU'
    },
    {
      name: 'Case ATX Mid Tower',
      description: 'Case ATX Mid Tower con buon airflow per gaming',
      component_type: 'Case'
    },
    {
      name: 'Motherboard AM4 B550',
      description: 'Motherboard AMD AM4 B550 per processori Ryzen',
      component_type: 'Motherboard'
    },
    {
      name: 'CPU Cooler Air',
      description: 'Dissipatori ad aria per CPU AMD e Intel',
      component_type: 'Cooler'
    }
  ];

  let createdCategories = 0;

  for (const categoryData of defaultCategories) {
    try {
      const categoryId = AlternativeCategory.create(categoryData);
      console.log(`✅ Categoria creata: ${categoryData.name} (ID: ${categoryId})`);
      createdCategories++;
    } catch (error) {
      console.log(`⚠️ Categoria già esistente o errore: ${categoryData.name}`);
    }
  }

  console.log(`✅ Inizializzate ${createdCategories} categorie alternative`);

  // Inizializza alternative predefinite
  await ComponentAlternatives.initializeDefaultAlternatives();

  console.log('🎉 Inizializzazione categorie alternative completata!');
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAlternativeCategories()
    .then(() => {
      console.log('✅ Script completato');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Errore:', error);
      process.exit(1);
    });
}

export default initializeAlternativeCategories;