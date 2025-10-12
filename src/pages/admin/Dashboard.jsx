import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, PlusCircle, TrendingUp, DollarSign, Zap, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [priceStats, setPriceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useAdminTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, buildsRes, priceStatsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/builds'),
        api.get('/admin/prices/stats'),
      ]);
      setStats(statsRes.data.stats);
      setRecentBuilds(buildsRes.data.builds.slice(0, 5));
      setPriceStats(priceStatsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Dashboard</h1>
          <p className={`mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Panoramica del tuo sito Build PC</p>
        </div>
        <Link to="/admin/builds/new" className="btn-primary btn-md inline-flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Nuova Build
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <p className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Totale Build</p>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{formatNumber(stats.total)}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Pubblicate</p>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{formatNumber(stats.published)}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Bozze</p>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{formatNumber(stats.drafts)}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className={`text-sm mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Visualizzazioni Totali</p>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{formatNumber(stats.totalViews)}</p>
          </div>
        </div>
      )}

      {/* Recent Builds */}
      <div className="card">
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Build Recenti</h2>
            <Link to="/admin/builds" className={`text-sm font-medium ${
              isDarkMode 
                ? 'text-primary-400 hover:text-primary-300' 
                : 'text-primary-600 hover:text-primary-700'
            }`}>
              Vedi tutte →
            </Link>
          </div>
        </div>
        <div className={`divide-y ${
          isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          {recentBuilds.length > 0 ? (
            recentBuilds.map((build) => (
              <Link
                key={build.id}
                to={`/admin/builds/edit/${build.id}`}
                className={`block p-6 transition ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>{build.title}</h3>
                    <div className={`flex items-center gap-4 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span className={`badge badge-${build.status === 'published' ? 'success' : 'warning'}`}>
                        {build.status === 'published' ? 'Pubblicato' : 'Bozza'}
                      </span>
                      {build.category && (
                        <span>{build.category}</span>
                      )}
                      {build.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {build.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className={`p-6 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>Nessuna build ancora. Creane una!</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Management */}
      {priceStats && (
        <div className="card p-6">
          <h2 className={`text-xl font-bold mb-4 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Gestione Prezzi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {priceStats.componentStats?.map((stat) => (
              <div key={stat.tier} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Tier {stat.tier}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    stat.tier === 'A' ? 'bg-green-100 text-green-800' :
                    stat.tier === 'B' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {stat.tier === 'A' ? 'Alta Priorità' :
                     stat.tier === 'B' ? 'Media Priorità' : 'Bassa Priorità'}
                  </span>
                </div>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{stat.total}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {stat.with_price}/{stat.total} con prezzi
                </div>
              </div>
            ))}
          </div>

          {priceStats.cacheStats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className={`font-semibold mb-2 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Cache Prezzi</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Totale cache:</span>
                  <span className={`ml-2 font-medium ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>{priceStats.cacheStats.total_cached}</span>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cache valide:</span>
                  <span className={`ml-2 font-medium ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>{priceStats.cacheStats.valid_cache}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                try {
                  await api.post('/admin/prices/update-tier/A');
                  alert('Aggiornamento prezzi Tier A completato!');
                } catch (error) {
                  alert('Errore nell\'aggiornamento dei prezzi');
                }
              }}
              className="btn-primary btn-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna Tier A
            </button>
            <button
              onClick={async () => {
                try {
                  await api.post('/admin/prices/update-tier/B');
                  alert('Aggiornamento prezzi Tier B completato!');
                } catch (error) {
                  alert('Errore nell\'aggiornamento dei prezzi');
                }
              }}
              className="btn-secondary btn-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna Tier B
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await api.post('/admin/components/assign-tiers');
                  alert(`Assegnazione automatica tier completata! ${result.data.assigned} componenti aggiornati.`);
                } catch (error) {
                  alert('Errore nell\'assegnazione automatica dei tier');
                }
              }}
              className="btn-secondary btn-sm inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Assegna Tier Auto
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className={`text-xl font-bold mb-4 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/builds/new"
            className={`p-4 border-2 border-dashed rounded-lg transition text-center ${
              isDarkMode 
                ? 'border-gray-600 hover:border-primary-500 hover:bg-primary-900/20' 
                : 'border-gray-300 hover:border-primary-600 hover:bg-primary-50'
            }`}
          >
            <PlusCircle className={`w-8 h-8 mx-auto mb-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Crea Nuova Build</p>
          </Link>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-4 border-2 border-dashed rounded-lg transition text-center ${
              isDarkMode 
                ? 'border-gray-600 hover:border-primary-500 hover:bg-primary-900/20' 
                : 'border-gray-300 hover:border-primary-600 hover:bg-primary-50'
            }`}
          >
            <FileText className={`w-8 h-8 mx-auto mb-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Visualizza Sitemap</p>
          </a>
          <Link
            to="/"
            target="_blank"
            className={`p-4 border-2 border-dashed rounded-lg transition text-center ${
              isDarkMode 
                ? 'border-gray-600 hover:border-primary-500 hover:bg-primary-900/20' 
                : 'border-gray-300 hover:border-primary-600 hover:bg-primary-50'
            }`}
          >
            <Eye className={`w-8 h-8 mx-auto mb-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Anteprima Sito</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
