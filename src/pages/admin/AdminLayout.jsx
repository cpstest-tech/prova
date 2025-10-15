import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, LayoutDashboard, FileText, LogOut, Menu, X, Key, Moon, Sun, Package, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Build', href: '/admin/builds', icon: FileText },
    { name: 'Alternative', href: '/admin/alternatives', icon: Package },
    { name: 'Sostituzioni', href: '/admin/replacements', icon: RotateCcw },
    { name: 'Cambia Password', href: '/admin/change-password', icon: Key },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 text-white transform transition-transform lg:translate-x-0 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-800'
          }`}>
            <Link to="/admin" className="flex items-center space-x-2">
              <Cpu className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">Build PC CMS</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    active
                      ? 'bg-primary-600 text-white'
                      : `text-gray-300 hover:text-white ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'
                        }`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className={`p-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <p className="text-gray-400">Connesso come</p>
                <p className="font-medium">{user?.username}</p>
              </div>
            </div>
            
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition mb-2 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className={`border-b sticky top-0 z-30 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Menu className={`w-6 h-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} />
            </button>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                target="_blank"
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-primary-400' 
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Visualizza Sito →
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
