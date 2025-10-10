import express from 'express';
import { Build } from '../models/Build.js';
import { Component } from '../models/Component.js';

const router = express.Router();

// Get tutte le build pubblicate
router.get('/', (req, res) => {
  try {
    const { category, limit } = req.query;
    
    let builds;
    if (category) {
      builds = Build.getByCategory(category);
    } else if (limit) {
      builds = Build.getPublished(parseInt(limit));
    } else {
      builds = Build.getPublished();
    }

    res.json({ builds });
  } catch (error) {
    console.error('Get builds error:', error);
    res.status(500).json({ error: { message: 'Errore nel recupero delle build' } });
  }
});

// Get build per slug
router.get('/:slug', (req, res) => {
  try {
    const build = Build.getBySlug(req.params.slug);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    if (build.status !== 'published') {
      return res.status(404).json({ error: { message: 'Build non disponibile' } });
    }

    const components = Component.getByBuildId(build.id);

    // Incrementa views
    Build.incrementViews(build.id);

    res.json({ 
      build: {
        ...build,
        components
      }
    });
  } catch (error) {
    console.error('Get build error:', error);
    res.status(500).json({ error: { message: 'Errore nel recupero della build' } });
  }
});

export default router;
