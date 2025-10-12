import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, DollarSign, ExternalLink } from 'lucide-react';
import api from '../utils/api';

export default function ComponentAlternatives({ component, onAlternativesChange }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAlternative, setNewAlternative] = useState({
    alternative_asin: '',
    alternative_name: '',
    alternative_price: '',
    priority: 1
  });

  useEffect(() => {
    if (component?.amazon_link) {
      fetchAlternatives();
    }
  }, [component]);

  const extractASINFromUrl = (url) => {
    if (!url) return null;
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
    return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;
  };

  const fetchAlternatives = async () => {
    const asin = extractASINFromUrl(component.amazon_link);
    if (!asin) return;

    try {
      setLoading(true);
      const response = await api.get(`/admin/alternatives/${asin}`);
      setAlternatives(response.data.alternatives || []);
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlternative = async () => {
    if (!newAlternative.alternative_asin || !newAlternative.alternative_name) {
      alert('ASIN e nome sono obbligatori');
      return;
    }

    const originalAsin = extractASINFromUrl(component.amazon_link);
    if (!originalAsin) {
      alert('Componente deve avere un link Amazon valido');
      return;
    }

    try {
      await api.post('/admin/alternatives', {
        originalAsin,
        alternativeAsin: newAlternative.alternative_asin,
        alternativeName: newAlternative.alternative_name,
        alternativePrice: newAlternative.alternative_price || null,
        priority: newAlternative.priority
      });

      setNewAlternative({
        alternative_asin: '',
        alternative_name: '',
        alternative_price: '',
        priority: 1
      });
      setShowAddForm(false);
      fetchAlternatives();
      
      if (onAlternativesChange) {
        onAlternativesChange();
      }
      
      alert('Alternativa aggiunta con successo!');
    } catch (error) {
      console.error('Error adding alternative:', error);
      alert(error.response?.data?.error?.message || 'Errore nell\'aggiunta dell\'alternativa');
    }
  };

  const handleEditAlternative = async (id, data) => {
    try {
      await api.put(`/admin/alternatives/${id}`, data);
      setEditingId(null);
      fetchAlternatives();
      
      if (onAlternativesChange) {
        onAlternativesChange();
      }
      
      alert('Alternativa aggiornata con successo!');
    } catch (error) {
      console.error('Error updating alternative:', error);
      alert(error.response?.data?.error?.message || 'Errore nell\'aggiornamento dell\'alternativa');
    }
  };

  const handleDeleteAlternative = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa alternativa?')) {
      return;
    }

    try {
      await api.delete(`/admin/alternatives/${id}`);
      fetchAlternatives();
      
      if (onAlternativesChange) {
        onAlternativesChange();
      }
      
      alert('Alternativa eliminata con successo!');
    } catch (error) {
      console.error('Error deleting alternative:', error);
      alert(error.response?.data?.error?.message || 'Errore nell\'eliminazione dell\'alternativa');
    }
  };

  if (!component?.amazon_link) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">
          Aggiungi un link Amazon al componente per gestire le alternative
        </p>
      </div>
    );
  }

  const originalAsin = extractASINFromUrl(component.amazon_link);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">
          Alternative per {component.name}
        </h4>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn-primary btn-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Alternativa
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <h5 className="font-medium">Nuova Alternativa</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">ASIN Alternativa *</label>
              <input
                type="text"
                value={newAlternative.alternative_asin}
                onChange={(e) => setNewAlternative(prev => ({ ...prev, alternative_asin: e.target.value }))}
                className="input"
                placeholder="B08XYZ123"
                maxLength="10"
              />
            </div>
            
            <div>
              <label className="label text-xs">Nome Alternativa *</label>
              <input
                type="text"
                value={newAlternative.alternative_name}
                onChange={(e) => setNewAlternative(prev => ({ ...prev, alternative_name: e.target.value }))}
                className="input"
                placeholder="Nome del prodotto alternativo"
              />
            </div>
            
            <div>
              <label className="label text-xs">Prezzo (€)</label>
              <input
                type="number"
                value={newAlternative.alternative_price}
                onChange={(e) => setNewAlternative(prev => ({ ...prev, alternative_price: e.target.value }))}
                className="input"
                placeholder="99.99"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="label text-xs">Priorità</label>
              <select
                value={newAlternative.priority}
                onChange={(e) => setNewAlternative(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="input"
              >
                <option value="1">1 - Massima priorità</option>
                <option value="2">2 - Alta priorità</option>
                <option value="3">3 - Media priorità</option>
                <option value="4">4 - Bassa priorità</option>
                <option value="5">5 - Minima priorità</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddAlternative}
              className="btn-primary btn-sm inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salva Alternativa
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary btn-sm inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Annulla
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      ) : alternatives.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">
            Nessuna alternativa configurata per questo componente
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alternatives.map((alt) => (
            <div key={alt.id} className="p-3 border border-gray-200 rounded-lg bg-white">
              {editingId === alt.id ? (
                <EditAlternativeForm
                  alternative={alt}
                  onSave={(data) => handleEditAlternative(alt.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alt.alternative_name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        ASIN: {alt.alternative_asin}
                      </span>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        Priorità: {alt.priority}
                      </span>
                    </div>
                    {alt.alternative_price && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <DollarSign className="w-3 h-3" />
                        €{alt.alternative_price}
                      </div>
                    )}
                    <a
                      href={`https://www.amazon.it/dp/${alt.alternative_asin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Vedi su Amazon
                    </a>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(alt.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifica"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlternative(alt.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditAlternativeForm({ alternative, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    alternative_asin: alternative.alternative_asin || '',
    alternative_name: alternative.alternative_name || '',
    alternative_price: alternative.alternative_price || '',
    priority: alternative.priority || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">ASIN Alternativa</label>
          <input
            type="text"
            value={formData.alternative_asin}
            onChange={(e) => setFormData(prev => ({ ...prev, alternative_asin: e.target.value }))}
            className="input"
            maxLength="10"
            required
          />
        </div>
        
        <div>
          <label className="label text-xs">Nome Alternativa</label>
          <input
            type="text"
            value={formData.alternative_name}
            onChange={(e) => setFormData(prev => ({ ...prev, alternative_name: e.target.value }))}
            className="input"
            required
          />
        </div>
        
        <div>
          <label className="label text-xs">Prezzo (€)</label>
          <input
            type="number"
            value={formData.alternative_price}
            onChange={(e) => setFormData(prev => ({ ...prev, alternative_price: e.target.value }))}
            className="input"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="label text-xs">Priorità</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            className="input"
          >
            <option value="1">1 - Massima priorità</option>
            <option value="2">2 - Alta priorità</option>
            <option value="3">3 - Media priorità</option>
            <option value="4">4 - Bassa priorità</option>
            <option value="5">5 - Minima priorità</option>
          </select>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="btn-primary btn-sm inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Salva
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary btn-sm inline-flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Annulla
        </button>
      </div>
    </form>
  );
}
