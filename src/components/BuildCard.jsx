import { Link } from 'react-router-dom';
import { Cpu, Eye, Calendar, ArrowRight } from 'lucide-react';
import { formatPrice, formatDate, getCategoryLabel } from '../utils/format';
import { motion } from 'framer-motion';

export default function BuildCard({ build }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link to={`/build/${build.slug}`} className="card glass-card glass-liquid glass-interactive overflow-hidden hover:shadow-2xl transition-all duration-300 group block">
        {/* Image */}
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-indigo-200 relative overflow-hidden rounded-t-2xl">
          {build.featured_image ? (
            <img
              src={build.featured_image}
              alt={build.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Cpu className="w-20 h-20 text-purple-400" />
              </motion.div>
            </div>
          )}
          {build.category && (
            <div className="absolute top-3 left-3">
              <span className="badge-purple font-semibold">
                {getCategoryLabel(build.category)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold card-title mb-2 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2">
            {build.title}
          </h3>
          
          {build.description && (
            <p className="card-text text-sm mb-4 line-clamp-2">
              {build.description}
            </p>
          )}

          <div className="flex items-center justify-center text-sm card-text mb-4 space-x-6">
            {build.budget && (
              <span className="font-bold text-purple-600 text-lg">
                {formatPrice(build.budget)}
              </span>
            )}
            {build.views > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{build.views}</span>
              </div>
            )}
            {build.published_at && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(build.published_at)}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <span className="text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
              Vedi dettagli
            </span>
            <motion.div
              className="text-purple-600 group-hover:text-purple-700 transition-colors ml-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
