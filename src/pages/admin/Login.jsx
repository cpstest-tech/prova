import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, User, AlertCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useAdminTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/admin');
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-primary-600 to-primary-800'
    }`}>
      <div className="w-full max-w-md">
        {/* Dark mode toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Cpu className={`w-10 h-10 ${
              isDarkMode ? 'text-primary-400' : 'text-primary-600'
            }`} />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-gray-100' : 'text-white'
          }`}>Build PC CMS</h1>
          <p className={`${
            isDarkMode ? 'text-gray-400' : 'text-primary-100'
          }`}>Accedi al pannello di amministrazione</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                isDarkMode 
                  ? 'bg-red-900/20 border border-red-800' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <p className={`text-sm ${
                  isDarkMode ? 'text-red-300' : 'text-red-800'
                }`}>{error}</p>
              </div>
            )}

            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Inserisci username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Inserisci password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
