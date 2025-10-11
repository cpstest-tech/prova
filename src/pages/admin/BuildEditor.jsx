import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, X, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import api from '../../utils/api';
import ThumbnailGenerator from '../../components/ThumbnailGenerator';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function BuildEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useAdminTheme();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showThumbnailGenerator, setShowThumbnailGenerator] = useState(false);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [generatedCartUrl, setGeneratedCartUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    featured_image: '',
    budget: '',
    category: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    affiliate_tag: '',
  });

  const [components, setComponents] = useState([]);

  useEffect(() => {
    if (isEdit) {
      fetchBuild();
    }
  }, [id]);

  const fetchBuild = async () => {
    try {
      const response = await api.get(`/admin/builds/${id}`);
      const build = response.data.build;
      setFormData({
        title: build.title || '',
        description: build.description || '',
        content: build.content || '',
        featured_image: build.featured_image || '',
        budget: build.budget || '',
        category: build.category || '',
        status: build.status || 'draft',
        meta_title: build.meta_title || '',
        meta_description: build.meta_description || '',
        affiliate_tag: build.affiliate_tag || '',
      });
      setComponents(build.components || []);
    } catch (error) {
      console.error('Error fetching build:', error);
      alert('Errore nel caricamento della build');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const addComponent = () => {
    setComponents([...components, {
      type: 'CPU',
      name: '',
      brand: '',
      model: '',
      price: '',
      amazon_link: '',
      specs: '',
      search_query: '',
      position: components.length,
    }]);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  // Genera link carrello Amazon
  const generateAmazonCartLink = () => {
    if (components.length === 0) {
      alert('Nessun componente da aggiungere al carrello');
      return;
    }

    const baseUrl = 'https://www.amazon.it/gp/aws/cart/add.html';
    const associateTag = formData.affiliate_tag || 'cpstest05-21';
    
    const params = new URLSearchParams();
    params.append('AssociateTag', associateTag);
    
    let asinCount = 0;
    components.forEach((component) => {
      if (component.amazon_link) {
        const asin = extractASINFromUrl(component.amazon_link);
        if (asin) {
          asinCount++;
          params.append(`ASIN.${asinCount}`, asin);
          params.append(`Quantity.${asinCount}`, '1');
        }
      }
    });
    
    if (asinCount === 0) {
      alert('Nessun componente ha un link Amazon valido');
      return;
    }

    const cartUrl = `${baseUrl}?${params.toString()}`;
    setGeneratedCartUrl(cartUrl);
    
    // Copia negli appunti
    navigator.clipboard.writeText(cartUrl).then(() => {
      alert(`Link carrello generato e copiato negli appunti!\n\nComponenti: ${asinCount}\nAffiliate tag: ${associateTag}`);
    }).catch(() => {
      alert(`Link carrello generato:\n\n${cartUrl}`);
    });
  };

  // Estrai ASIN da URL
  const extractASINFromUrl = (url) => {
    if (!url) return null;
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
    return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;
  };

  const handleAmazonImport = async () => {
    if (!amazonUrl) {
      alert('Inserisci un URL del carrello Amazon');
      return;
    }

    try {
      setImporting(true);
      const response = await api.post('/admin/import-amazon', { cartUrl: amazonUrl });
      
      const importedComponents = response.data.components || [];
      const affiliateTag = response.data.affiliateTag;
      
      // Aggiungi i componenti importati a quelli esistenti
      const newComponents = importedComponents.map((comp, idx) => ({
        type: comp.type || 'Other',
        name: comp.name || '',
        brand: comp.brand || '',
        model: comp.model || '',
        price: comp.price || '',
        amazon_link: comp.amazon_link || '',
        specs: comp.specs || '',
        search_query: comp.search_query || '',
        position: components.length + idx,
      }));
      
      setComponents([...components, ...newComponents]);
      
      // Salva l'affiliate tag se trovato
      if (affiliateTag && !formData.affiliate_tag) {
        setFormData(prev => ({ ...prev, affiliate_tag: affiliateTag }));
      }
      
      setShowAmazonImport(false);
      setAmazonUrl('');
      
      const message = affiliateTag 
        ? `Importati ${importedComponents.length} componenti con successo!\nAffiliate tag: ${affiliateTag}`
        : `Importati ${importedComponents.length} componenti con successo!`;
      
      alert(message);
    } catch (error) {
      console.error('Error importing from Amazon:', error);
      alert(error.response?.data?.error?.message || 'Errore nell\'importazione da Amazon');
    } finally {
      setImporting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const response = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, featured_image: response.data.url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Errore nel caricamento dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Il titolo è obbligatorio');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        components: components.map((comp, idx) => ({
          ...comp,
          price: comp.price ? parseFloat(comp.price) : null,
          position: idx,
        })),
      };

      if (isEdit) {
        await api.put(`/admin/builds/${id}`, payload);
      } else {
        await api.post('/admin/builds', payload);
      }

      navigate('/admin/builds');
    } catch (error) {
      console.error('Error saving build:', error);
      alert(error.response?.data?.error?.message || 'Errore nel salvataggio della build');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const componentTypes = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Other'];
  const categories = ['gaming', 'editing', 'office', 'workstation', 'budget', 'premium'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/builds" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle build
          </Link>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {isEdit ? 'Modifica Build' : 'Nuova Build'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Informazioni Base</h2>
          
          <div>
            <label className="label">Titolo *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="es. PC Gaming 1000€ - Perfetto per 1080p"
              required
            />
          </div>

          <div>
            <label className="label">Descrizione Breve</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea"
              rows="3"
              placeholder="Breve descrizione che apparirà nelle card e nei risultati di ricerca"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleziona categoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Budget (€)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="input"
                placeholder="1000"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="label">Stato</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="draft">Bozza</option>
              <option value="published">Pubblicato</option>
            </select>
          </div>
        </div>

        {/* Featured Image */}
        <div className="card p-6 space-y-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Immagine in Evidenza</h2>
          
          {formData.featured_image && (
            <div className="relative inline-block">
              <img
                src={formData.featured_image}
                alt="Preview"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <label className="btn-secondary btn-md cursor-pointer inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'Caricamento...' : 'Carica Immagine'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            
            <button
              type="button"
              onClick={() => setShowThumbnailGenerator(true)}
              className="btn-primary btn-md inline-flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Genera Thumbnail
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="card p-6 space-y-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Contenuto Articolo</h2>
          <p className="text-sm text-gray-600">
            Scrivi il contenuto dell'articolo. Usa # per H1, ## per H2, ### per H3
          </p>
          
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="textarea font-mono text-sm"
            rows="15"
            placeholder="# Titolo Principale&#10;&#10;Introduzione all'articolo...&#10;&#10;## Sezione 1&#10;&#10;Contenuto della sezione..."
          />
        </div>

        {/* Components */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Componenti</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateAmazonCartLink}
                className="btn-secondary btn-sm inline-flex items-center gap-2"
                disabled={components.length === 0}
                title="Genera link carrello Amazon"
              >
                <ShoppingCart className="w-4 h-4" />
                Genera Carrello
              </button>
              <button
                type="button"
                onClick={() => setShowAmazonImport(true)}
                className="btn-secondary btn-sm inline-flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Importa da Amazon
              </button>
              <button
                type="button"
                onClick={addComponent}
                className="btn-primary btn-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Componente
              </button>
            </div>
          </div>

          {components.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessun componente aggiunto. Clicca "Aggiungi Componente" per iniziare.
            </p>
          ) : (
            <div className="space-y-4">
              {components.map((component, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Componente {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Tipo *</label>
                      <select
                        value={component.type}
                        onChange={(e) => handleComponentChange(index, 'type', e.target.value)}
                        className="input"
                        required
                      >
                        {componentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label text-xs">Nome *</label>
                      <input
                        type="text"
                        value={component.name}
                        onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                        className="input"
                        placeholder="es. AMD Ryzen 5 5600"
                        required
                      />
                    </div>

                    <div>
                      <label className="label text-xs">Brand</label>
                      <input
                        type="text"
                        value={component.brand}
                        onChange={(e) => handleComponentChange(index, 'brand', e.target.value)}
                        className="input"
                        placeholder="es. AMD"
                      />
                    </div>

                    <div>
                      <label className="label text-xs">Modello</label>
                      <input
                        type="text"
                        value={component.model}
                        onChange={(e) => handleComponentChange(index, 'model', e.target.value)}
                        className="input"
                        placeholder="es. 5600"
                      />
                    </div>

                    <div>
                      <label className="label text-xs">Prezzo (€)</label>
                      <input
                        type="number"
                        value={component.price}
                        onChange={(e) => handleComponentChange(index, 'price', e.target.value)}
                        className="input"
                        placeholder="139.99"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="label text-xs">Link Amazon</label>
                      <input
                        type="url"
                        value={component.amazon_link}
                        onChange={(e) => handleComponentChange(index, 'amazon_link', e.target.value)}
                        className="input"
                        placeholder="https://amazon.it/dp/..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label text-xs">Specifiche</label>
                      <input
                        type="text"
                        value={component.specs}
                        onChange={(e) => handleComponentChange(index, 'specs', e.target.value)}
                        className="input"
                        placeholder="es. 6 core, 12 thread, 3.5GHz base"
                      />
                    </div>
                  </div>
                  
                  {/* Campo ricerca alternative */}
                  <div className="col-span-full">
                    <label className="label text-xs">
                      🔍 Ricerca Alternative
                      <span className="text-gray-400 ml-1">(opzionale)</span>
                    </label>
                    <textarea
                      value={component.search_query || ''}
                      onChange={(e) => handleComponentChange(index, 'search_query', e.target.value)}
                      className="input min-h-[80px] resize-none"
                      placeholder={`Esempio: ${component.name} OR ${component.type} alternative OR substitute ${component.type}

Separa le alternative con "OR" - il sistema prenderà il primo disponibile`}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Definisci cosa cercare su Amazon se questo prodotto va in esaurimento.
                      <br />
                      Esempi: "RTX 4060 Ti OR RTX 4070 OR RX 7600" oppure "DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amazon & SEO */}
        <div className="card p-6 space-y-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Amazon Affiliate</h2>
          
          <div>
            <label className="label">Affiliate Tag</label>
            <input
              type="text"
              name="affiliate_tag"
              value={formData.affiliate_tag}
              onChange={handleChange}
              className="input"
              placeholder="es. cpstest05-21"
            />
            <p className="text-xs text-gray-500 mt-1">
              Il tag affiliato Amazon verrà usato per generare il link "Compra Tutto" quando pubblichi l'articolo.
              {formData.affiliate_tag && ' Verrà applicato anche ai nuovi componenti importati.'}
            </p>
          </div>
        </div>

        {/* SEO */}
        <div className="card p-6 space-y-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>SEO</h2>
          
          <div>
            <label className="label">Meta Title</label>
            <input
              type="text"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleChange}
              className="input"
              placeholder="Lascia vuoto per usare il titolo"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ottimale: 50-60 caratteri. Attuale: {(formData.meta_title || formData.title).length}
            </p>
          </div>

          <div>
            <label className="label">Meta Description</label>
            <textarea
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              className="textarea"
              rows="3"
              placeholder="Lascia vuoto per usare la descrizione"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ottimale: 150-160 caratteri. Attuale: {(formData.meta_description || formData.description).length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <Link to="/admin/builds" className="btn-secondary btn-md">
            Annulla
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary btn-md inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Aggiorna Build' : 'Crea Build'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Thumbnail Generator Modal */}
      <ThumbnailGenerator
        isOpen={showThumbnailGenerator}
        onClose={() => setShowThumbnailGenerator(false)}
        onGenerate={(imageData) => {
          setFormData(prev => ({ ...prev, featured_image: imageData }));
          setShowThumbnailGenerator(false);
        }}
      />

      {/* Amazon Import Modal */}
      {showAmazonImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Importa da Amazon</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAmazonImport(false);
                  setAmazonUrl('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">URL del Carrello Amazon</label>
                <input
                  type="url"
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  className="input"
                  placeholder="https://www.amazon.it/gp/aws/cart/add.html?..."
                  disabled={importing}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Incolla qui il link del carrello Amazon con i componenti da importare.
                  L'URL deve contenere i parametri ASIN dei prodotti.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Come ottenere il link del carrello?</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Crea un link di affiliazione Amazon con i prodotti desiderati</li>
                  <li>Usa il formato: amazon.it/gp/aws/cart/add.html?ASIN.1=xxx&ASIN.2=yyy</li>
                  <li>Incolla il link completo nel campo sopra</li>
                  <li>I componenti verranno importati automaticamente con nome, prezzo e specifiche</li>
                </ol>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAmazonImport(false);
                    setAmazonUrl('');
                  }}
                  className="btn-secondary btn-md"
                  disabled={importing}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleAmazonImport}
                  disabled={importing || !amazonUrl}
                  className="btn-primary btn-md inline-flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importazione in corso...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Importa Componenti
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
