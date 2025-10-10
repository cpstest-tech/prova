import { initializeDatabase } from '../models/schema.js';
import { User } from '../models/User.js';
import { Build } from '../models/Build.js';
import { Component } from '../models/Component.js';

console.log('🔧 Inizializzazione database...\n');

// Inizializza schema
initializeDatabase();

// Crea utente admin di default
try {
  const existingAdmin = User.findByUsername('admin');
  
  if (!existingAdmin) {
    User.create('admin', 'admin123', 'admin@buildpc.local');
    console.log('✅ Utente admin creato');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  CAMBIA LA PASSWORD DOPO IL PRIMO LOGIN!\n');
  } else {
    console.log('ℹ️  Utente admin già esistente\n');
  }
} catch (error) {
  console.error('❌ Errore nella creazione dell\'utente admin:', error.message);
}

// Crea build di esempio
try {
  const existingBuilds = Build.getAll();
  
  if (existingBuilds.length === 0) {
    console.log('📝 Creazione build di esempio...\n');
    
    // Build Gaming 1000€
    const build1 = Build.create({
      title: 'PC Gaming 1000€ - Perfetto per 1080p',
      description: 'Una build bilanciata perfetta per giocare in Full HD con impostazioni alte. Ottimo rapporto qualità/prezzo.',
      content: `# PC Gaming 1000€ - La Build Perfetta per il 1080p

Questa configurazione è pensata per chi vuole entrare nel mondo del gaming PC senza spendere una fortuna, ma senza rinunciare alle prestazioni.

## Prestazioni Attese

- **Fortnite**: 144+ FPS (impostazioni competitive)
- **Warzone**: 100+ FPS (impostazioni medie-alte)
- **Cyberpunk 2077**: 60+ FPS (impostazioni medie)
- **Valorant**: 200+ FPS

## Perché Questi Componenti?

Ho scelto questi componenti dopo mesi di test e confronti. La RX 6700 XT è una bestia per il 1080p e anche il 1440p, mentre il Ryzen 5 5600 offre prestazioni eccellenti senza colli di bottiglia.

La RAM a 3200MHz è il sweet spot per Ryzen, e l'SSD NVMe garantisce caricamenti rapidissimi.

## Possibili Upgrade Futuri

- Aggiungi altri 16GB di RAM se fai streaming
- Passa a una RTX 4070 quando i prezzi scendono
- Aggiungi un HDD da 2TB per i giochi secondari`,
      featured_image: '/uploads/gaming-1000.jpg',
      budget: 1000,
      category: 'gaming',
      status: 'published',
      meta_title: 'PC Gaming 1000€ 2024 - Build Completa 1080p',
      meta_description: 'Guida completa per assemblare un PC gaming da 1000€. Componenti testati, link Amazon e consigli per il miglior rapporto qualità/prezzo.',
      author_id: 1
    });

    Component.bulkCreate(build1.id, [
      {
        type: 'CPU',
        name: 'AMD Ryzen 5 5600',
        brand: 'AMD',
        model: '5600',
        price: 139.99,
        amazon_link: 'https://amazon.it/dp/B09VCHR1VH?tag=your-tag',
        specs: '6 core, 12 thread, 3.5GHz base, 4.4GHz boost',
        position: 1
      },
      {
        type: 'GPU',
        name: 'AMD Radeon RX 6700 XT',
        brand: 'AMD',
        model: 'RX 6700 XT',
        price: 349.99,
        amazon_link: 'https://amazon.it/dp/B08WHJPBDV?tag=your-tag',
        specs: '12GB GDDR6, 2560 stream processors',
        position: 2
      },
      {
        type: 'Motherboard',
        name: 'MSI B550-A PRO',
        brand: 'MSI',
        model: 'B550-A PRO',
        price: 119.99,
        amazon_link: 'https://amazon.it/dp/B089CZSQB4?tag=your-tag',
        specs: 'ATX, PCIe 4.0, 4x DDR4',
        position: 3
      },
      {
        type: 'RAM',
        name: 'Corsair Vengeance LPX 16GB',
        brand: 'Corsair',
        model: 'CMK16GX4M2B3200C16',
        price: 54.99,
        amazon_link: 'https://amazon.it/dp/B0143UM4TC?tag=your-tag',
        specs: '2x8GB DDR4 3200MHz CL16',
        position: 4
      },
      {
        type: 'Storage',
        name: 'Kingston NV2 1TB',
        brand: 'Kingston',
        model: 'SNV2S/1000G',
        price: 59.99,
        amazon_link: 'https://amazon.it/dp/B0BBWH1R8Z?tag=your-tag',
        specs: 'NVMe PCIe 4.0, 3500MB/s read',
        position: 5
      },
      {
        type: 'PSU',
        name: 'Corsair CV650',
        brand: 'Corsair',
        model: 'CV650',
        price: 59.99,
        amazon_link: 'https://amazon.it/dp/B07YVVXYFN?tag=your-tag',
        specs: '650W 80+ Bronze',
        position: 6
      },
      {
        type: 'Case',
        name: 'Cooler Master MasterBox Q300L',
        brand: 'Cooler Master',
        model: 'Q300L',
        price: 49.99,
        amazon_link: 'https://amazon.it/dp/B0785GRMPG?tag=your-tag',
        specs: 'Micro ATX, pannello trasparente',
        position: 7
      }
    ]);

    console.log('✅ Build "PC Gaming 1000€" creata');

    // Build Editing 1500€
    const build2 = Build.create({
      title: 'PC Editing Video 1500€ - Workstation Completa',
      description: 'Configurazione ottimizzata per editing video 4K, rendering e multitasking pesante.',
      content: `# PC Editing Video 1500€ - Workstation Professionale

Se lavori con video editing, 3D rendering o semplicemente hai bisogno di tanta potenza per il multitasking, questa è la build che fa per te.

## Software Supportati

- **Premiere Pro**: Editing 4K fluido
- **After Effects**: Rendering veloce
- **DaVinci Resolve**: Color grading professionale
- **Blender**: Rendering 3D

## Focus sui Core

Ho scelto il Ryzen 7 5700X per i suoi 8 core e 16 thread, essenziali per il rendering. La RTX 4060 Ti offre accelerazione CUDA per Premiere e After Effects.

32GB di RAM sono il minimo per editing serio, e l'SSD da 2TB ti permette di lavorare su progetti grandi senza preoccupazioni.`,
      featured_image: '/uploads/editing-1500.jpg',
      budget: 1500,
      category: 'editing',
      status: 'published',
      meta_title: 'PC Editing Video 1500€ - Workstation 4K 2024',
      meta_description: 'Build PC per editing video professionale. Ottimizzata per Premiere Pro, After Effects e DaVinci Resolve. Componenti selezionati per massime prestazioni.',
      author_id: 1
    });

    Component.bulkCreate(build2.id, [
      {
        type: 'CPU',
        name: 'AMD Ryzen 7 5700X',
        brand: 'AMD',
        model: '5700X',
        price: 199.99,
        amazon_link: 'https://amazon.it/dp/B09VCHR1VH?tag=your-tag',
        specs: '8 core, 16 thread, 3.4GHz base, 4.6GHz boost',
        position: 1
      },
      {
        type: 'GPU',
        name: 'NVIDIA RTX 4060 Ti 16GB',
        brand: 'NVIDIA',
        model: 'RTX 4060 Ti',
        price: 499.99,
        amazon_link: 'https://amazon.it/dp/B0C7K2YNBR?tag=your-tag',
        specs: '16GB GDDR6, CUDA cores, DLSS 3',
        position: 2
      },
      {
        type: 'Motherboard',
        name: 'ASUS TUF Gaming B550-PLUS',
        brand: 'ASUS',
        model: 'TUF B550-PLUS',
        price: 149.99,
        amazon_link: 'https://amazon.it/dp/B088W57M4J?tag=your-tag',
        specs: 'ATX, PCIe 4.0, WiFi 6',
        position: 3
      },
      {
        type: 'RAM',
        name: 'G.Skill Ripjaws V 32GB',
        brand: 'G.Skill',
        model: 'F4-3600C18D-32GVK',
        price: 89.99,
        amazon_link: 'https://amazon.it/dp/B07X8DVDZZ?tag=your-tag',
        specs: '2x16GB DDR4 3600MHz CL18',
        position: 4
      },
      {
        type: 'Storage',
        name: 'Samsung 980 PRO 2TB',
        brand: 'Samsung',
        model: '980 PRO',
        price: 179.99,
        amazon_link: 'https://amazon.it/dp/B08RK2SR23?tag=your-tag',
        specs: 'NVMe PCIe 4.0, 7000MB/s read',
        position: 5
      },
      {
        type: 'PSU',
        name: 'Corsair RM750',
        brand: 'Corsair',
        model: 'RM750',
        price: 109.99,
        amazon_link: 'https://amazon.it/dp/B07RFZPCY9?tag=your-tag',
        specs: '750W 80+ Gold, modulare',
        position: 6
      },
      {
        type: 'Case',
        name: 'Fractal Design Meshify C',
        brand: 'Fractal Design',
        model: 'Meshify C',
        price: 89.99,
        amazon_link: 'https://amazon.it/dp/B074PGBGHW?tag=your-tag',
        specs: 'ATX, ottimo airflow, pannello vetro',
        position: 7
      }
    ]);

    console.log('✅ Build "PC Editing 1500€" creata');
    console.log('\n✨ Database inizializzato con successo!\n');
  } else {
    console.log('ℹ️  Build già presenti nel database\n');
  }
} catch (error) {
  console.error('❌ Errore nella creazione delle build di esempio:', error.message);
}

console.log('🎉 Inizializzazione completata!\n');
process.exit(0);
