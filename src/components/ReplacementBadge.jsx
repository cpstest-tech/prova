import { useState } from 'react';
import { RefreshCw, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

/**
 * Componente per mostrare i componenti sostituiti con badge e dettagli
 */
export default function ReplacementBadge({ component, onRestore, onViewOriginal }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!component.is_replacement) {
    return null;
  }

  const priceDifference = component.price_difference || 0;
  const isPriceIncrease = priceDifference > 0;
  const isPriceDecrease = priceDifference < 0;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      {/* Badge principale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🔄 Componente Sostituito
            </span>
          </div>
          
          {/* Indicatore differenza prezzo */}
          {priceDifference !== 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isPriceIncrease 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {isPriceIncrease ? '+' : ''}€{priceDifference.toFixed(2)}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Informazioni base */}
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium">{component.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ℹ️ Sostituito automaticamente
        </p>
      </div>

      {/* Dettagli espandibili */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 space-y-3">
          {/* Motivo sostituzione */}
          {component.replacement_reason && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo sostituzione:
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {component.replacement_reason}
              </p>
            </div>
          )}

          {/* Ultimo controllo */}
          {component.last_checked && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ultimo controllo:
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(component.last_checked).toLocaleString('it-IT')}
              </p>
            </div>
          )}

          {/* Azioni */}
          <div className="flex gap-2 pt-2">
            {onViewOriginal && component.original_component_id && (
              <button
                onClick={() => onViewOriginal(component.original_component_id)}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Vedi originale
              </button>
            )}
            
            {onRestore && (
              <button
                onClick={() => onRestore(component.id)}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Ripristina
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente per mostrare un badge semplice di sostituzione
 */
export function SimpleReplacementBadge({ component }) {
  if (!component.is_replacement) {
    return null;
  }

  const priceDifference = component.price_difference || 0;
  const isPriceIncrease = priceDifference > 0;

  return (
    <div className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
      <RefreshCw className="w-3 h-3" />
      <span>Sostituito</span>
      {priceDifference !== 0 && (
        <span className={`ml-1 ${
          isPriceIncrease ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}>
          ({isPriceIncrease ? '+' : ''}€{priceDifference.toFixed(2)})
        </span>
      )}
    </div>
  );
}

/**
 * Componente per mostrare le statistiche delle sostituzioni
 */
export function ReplacementStats({ stats }) {
  if (!stats || stats.replaced === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Statistiche Sostituzioni
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Componenti sostituiti:</span>
          <span className="ml-1 font-medium text-blue-700 dark:text-blue-300">
            {stats.replaced}/{stats.total}
          </span>
        </div>
        
        <div>
          <span className="text-gray-600 dark:text-gray-400">Differenza totale:</span>
          <span className={`ml-1 font-medium ${
            stats.totalPriceDifference >= 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {stats.totalPriceDifference >= 0 ? '+' : ''}€{stats.totalPriceDifference.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
