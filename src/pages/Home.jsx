import { useState, useEffect } from 'react';
import { Cpu, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react';
import axios from 'axios';
import BuildCard from '../components/BuildCard';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';

export default function Home() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/builds');
      setBuilds(response.data.builds);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        description="Guide complete per assemblare il tuo PC perfetto. Build gaming, editing e ufficio con componenti selezionati e prezzi aggiornati. Autore: Paolo Baldini."
        url="/"
      />

      {/* Hero Section */}
      <section className="relative text-slate-100 py-10 overflow-hidden">
        {/* Soft dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-transparent" />

        <div className="container relative z-10">
          <div className="card glass-liquid glow-strong p-8 md:p-10 w-full">
          <motion.div 
            className="w-full text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex items-center justify-center space-x-2 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="w-6 h-6 text-violet-300" />
              <span className="text-lg font-medium card-text">di Paolo Baldini</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-300 via-indigo-300 to-slate-100 bg-clip-text text-transparent">
              Assembla il tuo PC perfetto
            </h1>
            <p className="text-xl md:text-2xl card-text mb-8 leading-relaxed">
              Guide complete, FPS garantiti e prezzi aggiornati per ogni budget ed esigenza.
            </p>
            <motion.a 
              href="#builds" 
              className="btn-lg btn-rounded glass-button-dark glass-liquid glass-interactive hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Esplora le Build
            </motion.a>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Builds Section */}
      <section id="builds" className="py-10 relative">
        <div className="container">
          <div className="card glass-liquid glow-strong p-6 md:p-10">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Le Mie Build
            </h2>
            <p className="text-xl card-text max-w-2xl mx-auto">
              Configurazioni complete per ogni budget ed esigenza, dal gaming all'editing professionale.
            </p>
          </motion.div>


          {/* Builds Grid */}
          {loading ? (
            <motion.div 
              className="flex justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
            </motion.div>
          ) : builds.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {builds.map((build, index) => (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <BuildCard build={build} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Cpu className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-xl card-text">
                Nessuna build disponibile al momento.
              </p>
            </motion.div>
          )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 relative">
        <div className="container">
          <div className="card glass-liquid glow-strong p-6 md:p-10">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Perché Scegliere le Mie Build
            </h2>
            <p className="text-xl card-text max-w-2xl mx-auto">
              Ogni configurazione è studiata e testata per offrirti il massimo delle prestazioni.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="text-center card glass-liquid glass-interactive group"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm text-violet-300 rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 card-title">FPS Garantiti</h3>
              <p className="card-text">
                Ogni build è studiata per garantire gli FPS promessi in ogni gioco.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center card glass-liquid glass-interactive group"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm text-violet-300 rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 card-title">Prezzi Aggiornati</h3>
              <p className="card-text">
                Link diretti ad Amazon con i prezzi più recenti e le migliori offerte disponibili.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center card glass-liquid glass-interactive group"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm text-violet-300 rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Shield className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 card-title">Consigli Esperti</h3>
              <p className="card-text">
                Guide dettagliate con spiegazioni chiare e consigli pratici per ogni componente.
              </p>
            </motion.div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative text-slate-100 py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/50" />
        
        <div className="container text-center relative z-10">
          <div className="card glass-liquid glow-strong p-8 md:p-10 w-full">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              Pronto ad assemblare il tuo PC?
            </h2>
            <p className="text-xl card-text mb-8 max-w-2xl mx-auto">
              Scegli la build perfetta per te e inizia subito. Tutti i componenti sono disponibili su Amazon.
            </p>
            <motion.a 
              href="#builds" 
              className="btn-lg btn-rounded glass-button-dark glass-liquid glass-interactive hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Vedi Tutte le Build
            </motion.a>
          </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
