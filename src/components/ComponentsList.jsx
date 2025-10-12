import { ExternalLink, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatPrice, calculateTotal } from '../utils/format';
import { motion } from 'framer-motion';

export default function ComponentsList({ components }) {
  // Gestione più robusta degli errori
  if (!components || !Array.isArray(components) || components.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nessun componente disponibile</p>
      </div>
    );
  }

  // Ordine obbligatorio per i componenti
  const componentOrder = [
    'CPU',
    'Motherboard', 
    'RAM',
    'GPU',
    'Storage',
    'PSU',
    'Cooler',
    'Case'
  ];

  // Funzione per ordinare i componenti secondo l'ordine specificato
  const sortComponents = (components) => {
    // Verifica che components sia un array valido
    if (!Array.isArray(components)) {
      console.error('ComponentsList: components is not an array:', components);
      return [];
    }
    
    return [...components].sort((a, b) => {
      const indexA = componentOrder.indexOf(a.type);
      const indexB = componentOrder.indexOf(b.type);
      
      // Se entrambi i tipi sono nell'ordine specificato, ordina per posizione
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Se solo uno è nell'ordine specificato, quello viene prima
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nessuno è nell'ordine specificato, mantieni l'ordine originale
      return 0;
    });
  };

  const sortedComponents = sortComponents(components);
  const total = calculateTotal(sortedComponents);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-3">
          Componenti
        </h2>
        <div className="chip chip-glass glow-strong inline-flex">
          <span className="chip-dot"></span>
          <span>{sortedComponents.length} elementi</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedComponents.map((component, index) => (
          <motion.div 
            key={component.id} 
            className="card glass-liquid glass-interactive p-6 hover:shadow-2xl transition-all duration-300 group text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="mb-3 flex justify-center">
              <div className="chip chip-glass">
                <span className="chip-dot" />
                <span className="uppercase tracking-wide">{component.type}</span>
              </div>
            </div>
            
            
            <h3 className="font-bold card-title mb-2 group-hover:text-violet-300 transition-colors">
              {component.name}
            </h3>
            {component.specs && (
              <p className="text-sm card-text leading-relaxed mb-4">{component.specs}</p>
            )}
            <div className="font-bold text-xl text-violet-300 mb-4">
              {formatPrice(component.price)}
            </div>
            {component.amazon_link && (
              <motion.a
                href={component.amazon_link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-primary btn-sm inline-flex items-center gap-2 glow-strong"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Acquista</span>
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            )}
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <motion.div 
        className="card glass-liquid p-8 bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-violet-500/20 theme-dark:bg-gradient-to-r theme-dark:from-indigo-950/40 theme-dark:to-violet-950/30 theme-light:bg-gradient-to-r theme-light:from-indigo-100/80 theme-light:to-violet-100/60 theme-light:border-indigo-200/40"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="text-center mb-4">
          <div className="text-xl font-bold card-title mb-2">Totale Build</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            {formatPrice(total)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <div className="chip chip-glass">
            <span className="chip-dot"></span>
            <span>IVA variabile</span>
          </div>
          <div className="chip chip-glass">
            <span className="chip-dot"></span>
            <span>Prezzi aggiornati</span>
          </div>
        </div>
        <p className="text-sm card-text text-center">
          * I prezzi possono variare. Verifica su Amazon per i prezzi aggiornati.
        </p>
      </motion.div>
    </motion.div>
  );
}
