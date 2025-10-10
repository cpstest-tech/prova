import { Outlet, Link } from 'react-router-dom';
import { Cpu, Menu, X, ExternalLink, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Initialize theme from localStorage or prefers-color-scheme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      applyTheme(initial);
    }
    // listen for system changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const sys = e.matches ? 'dark' : 'light';
      if (!localStorage.getItem('theme')) {
        setTheme(sys);
        applyTheme(sys);
      }
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const applyTheme = (t) => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(t === 'dark' ? 'theme-dark' : 'theme-light');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Refraction background layer */}
      <div className="refraction-bg" />
      {/* Header */}
      <header className="glass-nav-dark sticky top-0 z-50">
        <nav className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/" className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent hover:from-violet-300 hover:to-indigo-300 transition-all duration-300">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Cpu className="w-8 h-8 text-violet-400" />
                </motion.div>
                <span className="font-extrabold">cpstest_</span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/" className="nav-link font-medium transition-all duration-300 hover:scale-105">
                Home
              </Link>
              <Link to="/#builds" className="nav-link font-medium transition-all duration-300 hover:scale-105">
                Build
              </Link>
              <a 
                href="https://www.tiktok.com/@cpstest_" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nav-link font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-1"
              >
                <span>TikTok</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Theme toggle + Mobile menu button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 btn-rounded glass-button-dark hover:bg-white/10 transition-all duration-300"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
            <motion.button
              onClick={toggleTheme}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 btn-rounded glass-button-dark hover:bg-white/10 transition-all duration-300 ml-3"
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5 text-violet-500" />
              )}
              <span className="text-sm text-slate-200/90">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </motion.button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-white/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-link font-medium transition-all duration-300 hover:scale-105"
                >
                  Home
                </Link>
                <Link
                  to="/#builds"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-link font-medium transition-all duration-300 hover:scale-105"
                >
                  Build
                </Link>
                <a
                  href="https://www.tiktok.com/@cpstest_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                >
                  <span>TikTok</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 px-3 py-2 btn-rounded glass-button-dark hover:bg-white/10 transition-all duration-300 w-max"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-violet-500" />
                  )}
                  <span className="text-sm text-slate-200/90">Tema: {theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-slate-300 mt-20 relative z-10">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-2 text-xl font-bold text-white mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Cpu className="w-8 h-8 text-violet-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-extrabold">cpstest_</span>
              </div>
              <p className="text-sm text-gray-300">
                Guide complete per assemblare il tuo PC perfetto. Build gaming, editing e ufficio con componenti selezionati.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Autore: <span className="text-purple-400 font-medium">Paolo Baldini</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-white mb-4">Link Utili</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="hover:text-violet-400 transition-all duration-300 hover:scale-105 inline-block">Home</Link>
                </li>
                <li>
                  <Link to="/#builds" className="hover:text-violet-400 transition-all duration-300 hover:scale-105 inline-block">Tutte le Build</Link>
                </li>
                <li>
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/sitemap.xml`} className="hover:text-purple-400 transition-all duration-300 hover:scale-105 inline-block">Sitemap</a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/@cpstest_" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-all duration-300 hover:scale-105 inline-block flex items-center space-x-1">
                    <span>TikTok</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-white mb-4">Informazioni</h3>
              <p className="text-sm mb-2 text-gray-300">
                Questo sito contiene link affiliati Amazon. Potremmo ricevere una commissione per gli acquisti effettuati tramite questi link.
              </p>
              <p className="text-xs text-gray-400">
                Tag affiliato: <span className="text-violet-400 font-mono">cpstest05-21</span>
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="border-t border-slate-700 mt-8 pt-8 text-sm text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p>&copy; {new Date().getFullYear()} cpstest_ - Paolo Baldini. Tutti i diritti riservati.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
