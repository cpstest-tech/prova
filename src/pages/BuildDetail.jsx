import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Share2, Facebook, Twitter, MessageCircle, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import ComponentsList from '../components/ComponentsList';
import SEO from '../components/SEO';
import { formatDate, getCategoryLabel } from '../utils/format';
import { parseMarkdown } from '../utils/markdown';
import { motion } from 'framer-motion';

export default function BuildDetail() {
  const { slug } = useParams();
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBuild();
  }, [slug]);

  const fetchBuild = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/builds/${slug}`);
      console.log('Build API Response:', response.data); // Debug log
      
      if (response.data && response.data.build) {
        setBuild(response.data.build);
      } else {
        console.error('Invalid build response structure:', response.data);
        setError('Struttura dati non valida');
      }
    } catch (error) {
      console.error('Error fetching build:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(error.response?.data?.error?.message || 'Errore nel caricamento della build');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = window.location.href;
  const shareText = build ? `Guarda questa build PC: ${build.title}` : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
  };

  // Funzione per generare il link "Compra Tutto" Amazon
  const generateBuyAllLink = () => {
    if (!build?.components || build.components.length === 0) return null;
    
    const baseUrl = 'https://www.amazon.it/gp/aws/cart/add.html';
    // Usa l'affiliate tag della build se disponibile, altrimenti usa quello di default
    const associateTag = build.affiliate_tag || 'cpstest05-21';
    
    const params = new URLSearchParams();
    params.append('AssociateTag', associateTag);
    
    let asinCount = 0;
    build.components.forEach((component) => {
      if (component.amazon_link) {
        const asin = extractASINFromUrl(component.amazon_link);
        if (asin) {
          asinCount++;
          params.append(`ASIN.${asinCount}`, asin);
          params.append(`Quantity.${asinCount}`, '1');
        }
      }
    });
    
    // Ritorna null se non ci sono ASIN
    if (asinCount === 0) return null;
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Funzione per estrarre ASIN da URL Amazon
  const extractASINFromUrl = (url) => {
    if (!url) return null;
    // Cerca l'ASIN nel formato /dp/ASIN o ?tag=...&asin=... o alla fine dell'URL
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
    return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        ></motion.div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <motion.div 
        className="container py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Build non trovata</h1>
        <p className="text-gray-600 mb-8">{error || 'La build richiesta non esiste.'}</p>
        <Link to="/" className="btn-primary btn-md">
          Torna alla Home
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <SEO
        title={build.meta_title || build.title}
        description={build.meta_description || build.description}
        image={build.featured_image}
        url={`/build/${build.slug}`}
        type="article"
      />

      <article>
        {/* Hero Image */}
        {build.featured_image && (
          <motion.div 
            className="w-full h-64 md:h-96 bg-gradient-to-br from-purple-100 to-indigo-200 relative overflow-hidden"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <img
              src={build.featured_image}
              alt={build.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </motion.div>
        )}

        {/* Content */}
        <div className="container py-8 md:py-12">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-flex items-center text-violet-300 hover:text-violet-200 mb-6 group">
              <motion.div
                whileHover={{ x: -5 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
              </motion.div>
              Torna alle build
            </Link>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.header 
              className="mb-8 card glass-liquid glow-strong p-6 md:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {build.category && (
                <span className="badge-purple mb-4">
                  {getCategoryLabel(build.category)}
                </span>
              )}
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                {build.title}
              </h1>

              {build.description && (
                <p className="text-xl text-slate-300 mb-6">
                  {build.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {build.published_at && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(build.published_at)}</span>
                  </div>
                )}
                {build.views > 0 && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{build.views} visualizzazioni</span>
                  </div>
                )}
              </div>
            </motion.header>

            {/* Share Buttons */}
            <motion.div 
              className="flex items-center gap-2 mb-8 card glass-liquid glow-strong p-4 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-sm font-medium text-slate-200 mr-2">Condividi:</span>
              <motion.a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-110"
                title="Condividi su Facebook"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-all duration-300 hover:scale-110"
                title="Condividi su Twitter"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-110"
                title="Condividi su WhatsApp"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-4 h-4" />
              </motion.a>
              <motion.a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                title="Condividi su Telegram"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Content */}
            {build.content && (
              <div className="prose max-w-none mb-12 card glass-liquid glow-strong p-6 md:p-8" dangerouslySetInnerHTML={{ __html: parseMarkdown(build.content) }} />
            )}

            {/* Components List */}
            {build.components && build.components.length > 0 && (
              <div className="card glass-liquid glow-strong p-6 md:p-8">
                <ComponentsList components={build.components} />
                
                {/* Compra Tutto Button */}
                {generateBuyAllLink() && (
                  <motion.div 
                    className="mt-8 p-6 glass-liquid glass-interactive rounded-2xl text-center border border-violet-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-xl font-bold text-slate-100 mb-4">
                      🛒 Compra Tutto su Amazon
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Aggiungi tutti i componenti al carrello Amazon con un solo click
                    </p>
                    <motion.a
                      href={generateBuyAllLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary btn-lg inline-flex items-center space-x-2 glow-strong"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Compra Tutto su Amazon</span>
                    </motion.a>
                    <p className="text-xs text-slate-400 mt-3">
                      * Link affiliato - Supporta cpstest_ senza costi aggiuntivi
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <motion.div 
              className="mt-12 p-6 card glass-liquid glow-strong rounded-2xl border border-yellow-300/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-sm text-slate-300">
                <strong className="text-violet-400">Nota:</strong> Questo articolo contiene link affiliati Amazon. Potremmo ricevere una piccola commissione per gli acquisti effettuati tramite questi link, senza costi aggiuntivi per te. Questo ci aiuta a mantenere il sito e creare nuovi contenuti per <span className="font-semibold text-violet-400">cpstest_</span>.
              </p>
            </motion.div>
          </div>
        </div>
      </article>
    </>
  );
}
