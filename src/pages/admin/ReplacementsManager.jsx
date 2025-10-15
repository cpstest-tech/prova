import { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, ExternalLink, Package, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

export default function ReplacementsManager() {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetchReplacements();
  }, []);

  const fetchReplacements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/replacements');
      setReplacements(response.data.replacements || []);
    } catch (error) {
      console.error('Error fetching replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (replacementId) => {
    if (!confirm('Sei sicuro di voler ripristinare il componente originale? Questa azione eliminerà il componente sostitutivo.')) {
      return;
    }

    try {
      setRestoring(replacementId);
      await api.post(`/admin/replacements/${replacementId}/restore`);
      alert('Componente ripristinato con successo!');
      fetchReplacements();
    } catch (error) {
      console.error('Error restoring component:', error);
      alert(error.response?.data?.error?.message || 'Errore nel ripristino del componente');
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Sostituzioni</h2>
          <p className="text-gray-600 mt-1">
            Componenti che sono stati sostituiti automaticamente
          </p>
        </div>
        <button
          onClick={fetchReplacements}
          className="btn-secondary inline-flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </button>
      </div>

      {replacements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna sostituzione
          </h3>
          <p className="text-gray-600">
            Non ci sono componenti sostituiti al momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {replacements.map((replacement) => (
            <div key={replacement.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded">
                    SOSTITUITO
                  </span>
                </div>
                <button
                  onClick={() => handleRestore(replacement.id)}
                  disabled={restoring === replacement.id}
                  className="btn-secondary btn-sm inline-flex items-center gap-2"
                  title="Ripristina componente originale"
                >
                  <RotateCcw className={`w-4 h-4 ${restoring === replacement.id ? 'animate-spin' : ''}`} />
                  Ripristina
                </button>
              </div>

              <div className="space-y-4">
                {/* Componente Sostitutivo */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Componente Attuale</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">{replacement.name}</span>
                      <span className="text-lg font-bold text-green-700">
                        €{replacement.price?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>ASIN: {replacement.asin}</div>
                      <div>Tipo: {replacement.type}</div>
                      {replacement.amazon_link && (
                        <a
                          href={replacement.amazon_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Vedi su Amazon
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Componente Originale */}
                {replacement.original_name && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Componente Originale</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{replacement.original_name}</span>
                        <span className="text-sm text-gray-500">Non disponibile</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>ASIN: {replacement.original_asin}</div>
                        {replacement.original_link && (
                          <a
                            href={replacement.original_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Vedi originale
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Motivo della sostituzione */}
                {replacement.replacement_reason && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Motivo</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {replacement.replacement_reason}
                    </p>
                  </div>
                )}

                {/* Informazioni aggiuntive */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <div>ID: {replacement.id}</div>
                  <div>Build ID: {replacement.build_id}</div>
                  <div>Sostituito il: {new Date(replacement.created_at).toLocaleString('it-IT')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

