import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Package, Settings } from 'lucide-react';
import { api } from '../../utils/api';

const AlternativesManager = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateAlternative, setShowCreateAlternative] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingAlternative, setEditingAlternative] = useState(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    component_type: ''
  });

  const [alternativeForm, setAlternativeForm] = useState({
    alternativeAsin: '',
    alternativeName: '',
    alternativePrice: '',
    priority: 1
  });

  const componentTypes = [
    'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Other'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/alternative-categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlternatives = async (categoryId) => {
    try {
      const response = await api.get(`/admin/alternative-categories/${categoryId}`);
      setAlternatives(response.data.category.alternatives || []);
    } catch (error) {
      console.error('Errore caricamento alternative:', error);
      setAlternatives([]);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadAlternatives(category.id);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/alternative-categories', categoryForm);
      setShowCreateCategory(false);
      setCategoryForm({ name: '', description: '', component_type: '' });
      loadCategories();
    } catch (error) {
      console.error('Errore creazione categoria:', error);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/alternative-categories/${editingCategory.id}`, categoryForm);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', component_type: '' });
      loadCategories();
    } catch (error) {
      console.error('Errore aggiornamento categoria:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria? Verranno eliminate anche tutte le alternative.')) {
      return;
    }
    try {
      await api.delete(`/admin/alternative-categories/${categoryId}`);
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
        setAlternatives([]);
      }
      loadCategories();
    } catch (error) {
      console.error('Errore eliminazione categoria:', error);
    }
  };

  const handleCreateAlternative = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/alternative-categories/${selectedCategory.id}/alternatives`, alternativeForm);
      setShowCreateAlternative(false);
      setAlternativeForm({ alternativeAsin: '', alternativeName: '', alternativePrice: '', priority: 1 });
      loadAlternatives(selectedCategory.id);
    } catch (error) {
      console.error('Errore creazione alternativa:', error);
    }
  };

  const handleUpdateAlternative = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/alternatives/${editingAlternative.id}`, alternativeForm);
      setEditingAlternative(null);
      setAlternativeForm({ alternativeAsin: '', alternativeName: '', alternativePrice: '', priority: 1 });
      loadAlternatives(selectedCategory.id);
    } catch (error) {
      console.error('Errore aggiornamento alternativa:', error);
    }
  };

  const handleDeleteAlternative = async (alternativeId) => {
    if (!confirm('Sei sicuro di voler eliminare questa alternativa?')) {
      return;
    }
    try {
      await api.delete(`/admin/alternatives/${alternativeId}`);
      loadAlternatives(selectedCategory.id);
    } catch (error) {
      console.error('Errore eliminazione alternativa:', error);
    }
  };

  const handlePriorityChange = async (alternativeId, direction) => {
    const alternative = alternatives.find(alt => alt.id === alternativeId);
    if (!alternative) return;

    const newPriority = direction === 'up' 
      ? Math.max(1, alternative.priority - 1)
      : alternative.priority + 1;

    try {
      await api.put(`/admin/alternatives/${alternativeId}`, {
        ...alternative,
        priority: newPriority
      });
      loadAlternatives(selectedCategory.id);
    } catch (error) {
      console.error('Errore aggiornamento priorità:', error);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      component_type: category.component_type || ''
    });
  };

  const startEditAlternative = (alternative) => {
    setEditingAlternative(alternative);
    setAlternativeForm({
      alternativeAsin: alternative.alternative_asin,
      alternativeName: alternative.alternative_name,
      alternativePrice: alternative.alternative_price || '',
      priority: alternative.priority
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Caricamento categorie...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Package className="inline-block w-8 h-8 mr-3" />
          Gestione Alternative Componenti
        </h1>
        <p className="text-gray-600">
          Organizza le alternative dei componenti per categoria e gestisci le priorità di selezione.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Categorie */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Categorie</h2>
            <button
              onClick={() => setShowCreateCategory(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuova Categoria
            </button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCategory?.id === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.component_type && (
                      <p className="text-sm text-gray-500">{category.component_type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditCategory(category);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Alternative */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          {selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Alternative - {selectedCategory.name}
                  </h2>
                  {selectedCategory.description && (
                    <p className="text-gray-600 text-sm">{selectedCategory.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateAlternative(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuova Alternativa
                </button>
              </div>

              <div className="space-y-3">
                {alternatives.map((alternative, index) => (
                  <div
                    key={alternative.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            #{alternative.priority}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {alternative.alternative_name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          ASIN: {alternative.alternative_asin}
                        </p>
                        {alternative.alternative_price && (
                          <p className="text-sm font-medium text-green-600">
                            €{alternative.alternative_price}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePriorityChange(alternative.id, 'up')}
                          disabled={alternative.priority <= 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePriorityChange(alternative.id, 'down')}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditAlternative(alternative)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlternative(alternative.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {alternatives.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nessuna alternativa configurata per questa categoria.</p>
                    <button
                      onClick={() => setShowCreateAlternative(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Aggiungi la prima alternativa
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Seleziona una categoria per gestire le alternative</p>
              <p className="text-sm">Le alternative vengono ordinate per priorità (1 = più importante)</p>
            </div>
          )}
        </div>
      </div>

      {/* Modali */}
      {showCreateCategory && (
        <CategoryModal
          title="Nuova Categoria"
          onSubmit={handleCreateCategory}
          onClose={() => setShowCreateCategory(false)}
          form={categoryForm}
          setForm={setCategoryForm}
          componentTypes={componentTypes}
        />
      )}

      {editingCategory && (
        <CategoryModal
          title="Modifica Categoria"
          onSubmit={handleUpdateCategory}
          onClose={() => setEditingCategory(null)}
          form={categoryForm}
          setForm={setCategoryForm}
          componentTypes={componentTypes}
        />
      )}

      {showCreateAlternative && selectedCategory && (
        <AlternativeModal
          title="Nuova Alternativa"
          onSubmit={handleCreateAlternative}
          onClose={() => setShowCreateAlternative(false)}
          form={alternativeForm}
          setForm={setAlternativeForm}
        />
      )}

      {editingAlternative && (
        <AlternativeModal
          title="Modifica Alternativa"
          onSubmit={handleUpdateAlternative}
          onClose={() => setEditingAlternative(null)}
          form={alternativeForm}
          setForm={setAlternativeForm}
        />
      )}
    </div>
  );
};

// Componente Modale Categoria
const CategoryModal = ({ title, onSubmit, onClose, form, setForm, componentTypes }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Categoria *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Componente
            </label>
            <select
              value={form.component_type}
              onChange={(e) => setForm({ ...form, component_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona tipo</option>
              {componentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Componente Modale Alternativa
const AlternativeModal = ({ title, onSubmit, onClose, form, setForm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ASIN Alternativa *
            </label>
            <input
              type="text"
              value={form.alternativeAsin}
              onChange={(e) => setForm({ ...form, alternativeAsin: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="B09ABC456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Prodotto *
            </label>
            <input
              type="text"
              value={form.alternativeName}
              onChange={(e) => setForm({ ...form, alternativeName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Samsung 970 EVO Plus 500GB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prezzo (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.alternativePrice}
              onChange={(e) => setForm({ ...form, alternativePrice: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="129.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorità
            </label>
            <input
              type="number"
              min="1"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">1 = più importante, 2 = secondaria, etc.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Salva
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AlternativesManager;
