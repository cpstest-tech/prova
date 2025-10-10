import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Eye, Search } from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '../../utils/format';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function BuildsList() {
  const [builds, setBuilds] = useState([]);
  const [filteredBuilds, setFilteredBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { isDarkMode } = useAdminTheme();

  useEffect(() => {
    fetchBuilds();
  }, []);

  useEffect(() => {
    filterBuilds();
  }, [builds, searchTerm, statusFilter]);

  const fetchBuilds = async () => {
    try {
      const response = await api.get('/admin/builds');
      setBuilds(response.data.builds);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBuilds = () => {
    let filtered = [...builds];

    if (searchTerm) {
      filtered = filtered.filter(build =>
        build.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(build => build.status === statusFilter);
    }

    setFilteredBuilds(filtered);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Sei sicuro di voler eliminare "${title}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/builds/${id}`);
      setBuilds(builds.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting build:', error);
      alert('Errore durante l\'eliminazione della build');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Build</h1>
          <p className={`mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Gestisci tutte le tue configurazioni PC</p>
        </div>
        <Link to="/admin/builds/new" className="btn-primary btn-md inline-flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Nuova Build
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Cerca build..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">Tutti gli stati</option>
            <option value="published">Pubblicati</option>
            <option value="draft">Bozze</option>
          </select>
        </div>
      </div>

      {/* Builds Table */}
      <div className="card overflow-hidden">
        {filteredBuilds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Titolo
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Categoria
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Budget
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Stato
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Views
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Data
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode 
                  ? 'bg-gray-900 divide-gray-700' 
                  : 'bg-white divide-gray-200'
              }`}>
                {filteredBuilds.map((build) => (
                  <tr key={build.id} className={`transition ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{build.title}</div>
                      {build.description && (
                        <div className={`text-sm line-clamp-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{build.description}</div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {build.category || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {build.budget ? formatPrice(build.budget) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge badge-${getStatusColor(build.status)}`}>
                        {getStatusLabel(build.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {build.views || 0}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatDate(build.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {build.status === 'published' && (
                          <Link
                            to={`/build/${build.slug}`}
                            target="_blank"
                            className={`p-2 rounded-lg transition ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-primary-400 hover:bg-gray-800' 
                                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                            }`}
                            title="Visualizza"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          to={`/admin/builds/edit/${build.id}`}
                          className={`p-2 rounded-lg transition ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-primary-400 hover:bg-gray-800' 
                              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                          }`}
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(build.id, build.title)}
                          className={`p-2 rounded-lg transition ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Nessuna build trovata con i filtri selezionati' 
                : 'Nessuna build ancora. Creane una!'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/admin/builds/new" className="btn-primary btn-md inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Crea Prima Build
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
