import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { isDarkMode } = useAdminTheme();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Validazione password in tempo reale
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Minimo 8 caratteri');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Almeno una lettera maiuscola');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Almeno una lettera minuscola');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Almeno un numero');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Almeno un carattere speciale (!@#$%...)');
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Valida la nuova password mentre la digiti
    if (name === 'newPassword') {
      setValidationErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validazioni
    if (!formData.currentPassword) {
      setError('Inserisci la password corrente');
      return;
    }

    const errors = validatePassword(formData.newPassword);
    if (errors.length > 0) {
      setError('La password non soddisfa i requisiti di sicurezza');
      setValidationErrors(errors);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('La nuova password deve essere diversa da quella corrente');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setValidationErrors([]);

      // Redirect dopo 2 secondi
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error?.message || 'Errore durante il cambio password');
      if (err.response?.data?.error?.details) {
        setValidationErrors(err.response.data.error.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { label: '', color: '', width: '0%' };
    
    const errors = validatePassword(password);
    const strength = 5 - errors.length;
    
    if (strength <= 1) return { label: 'Molto Debole', color: 'bg-red-500', width: '20%' };
    if (strength === 2) return { label: 'Debole', color: 'bg-orange-500', width: '40%' };
    if (strength === 3) return { label: 'Media', color: 'bg-yellow-500', width: '60%' };
    if (strength === 4) return { label: 'Forte', color: 'bg-blue-500', width: '80%' };
    return { label: 'Molto Forte', color: 'bg-green-500', width: '100%' };
  };

  const strength = getPasswordStrength(formData.newPassword);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Lock className="w-8 h-8 text-primary-600" />
          Cambia Password
        </h1>
        <p className="mt-2 text-gray-600">
          Aggiorna la tua password per mantenere l'account sicuro
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Alert requisiti sicurezza */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Requisiti Password Sicura:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Minimo 8 caratteri
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Almeno una lettera maiuscola (A-Z)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Almeno una lettera minuscola (a-z)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Almeno un numero (0-9)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Almeno un carattere speciale (!@#$%...)
            </li>
          </ul>
        </div>

        {/* Messaggio successo */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Password aggiornata con successo!</p>
              <p className="text-sm text-green-700 mt-1">Verrai reindirizzato alla dashboard...</p>
            </div>
          </div>
        )}

        {/* Messaggio errore */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password corrente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Corrente
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Inserisci password corrente"
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nuova password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuova Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Inserisci nuova password"
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Indicatore forza password */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Forza password:</span>
                  <span className={`text-sm font-medium ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Conferma password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conferma Nuova Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Conferma nuova password"
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">Le password non corrispondono</p>
            )}
          </div>

          {/* Bottoni */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || success || validationErrors.length > 0}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>

      {/* Tips sicurezza */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>💡 Tips per una Password Sicura:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Usa una combinazione unica di lettere, numeri e simboli</li>
          <li>✅ Evita informazioni personali (nome, data di nascita, etc.)</li>
          <li>✅ Non riutilizzare password di altri siti</li>
          <li>✅ Cambia password regolarmente</li>
          <li>✅ Usa un password manager per memorizzarla in modo sicuro</li>
        </ul>
      </div>
    </div>
  );
}

