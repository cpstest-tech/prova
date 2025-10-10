import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Unicorni che saltano */}
      <div className="unicorn unicorn-1">🦄</div>
      <div className="unicorn unicorn-2">🦄</div>
      <div className="unicorn unicorn-3">🦄</div>
      <div className="unicorn unicorn-4">🦄</div>
      <div className="unicorn unicorn-5">🦄</div>
      
      {/* Stelle animate */}
      <div className="star star-1">✨</div>
      <div className="star star-2">⭐</div>
      <div className="star star-3">✨</div>
      <div className="star star-4">⭐</div>
      <div className="star star-5">✨</div>
      
      <div className="text-center px-4 relative z-10">
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-4 animate-bounce-slow">104</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-pulse">Pagina non trovata</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto animate-fade-in">
          La pagina che stai cercando non esiste o hai la 104
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary btn-lg inline-flex items-center gap-2 hover:animate-wiggle">
            <Home className="w-5 h-5" />
            Torna alla Home
          </Link>
          <Link to="/#builds" className="btn-secondary btn-lg inline-flex items-center gap-2 hover:animate-wiggle">
            <Search className="w-5 h-5" />
            Esplora le Build
          </Link>
        </div>
      </div>
    </div>
  );
}
