import express from 'express';
import { Build } from '../models/Build.js';
import { Component } from '../models/Component.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { importFromAmazonCart } from '../utils/amazonParser.js';

const router = express.Router();

// Applica autenticazione a tutte le route admin
router.use(authenticateToken);
router.use(requireAdmin);

// Get tutte le build (incluse bozze)
router.get('/builds', (req, res) => {
  try {
    const builds = Build.getAll();
    res.json({ builds });
  } catch (error) {
    console.error('Admin get builds error:', error);
    res.status(500).json({ error: { message: 'Errore nel recupero delle build' } });
  }
});

// Get singola build per ID
router.get('/builds/:id', (req, res) => {
  try {
    const build = Build.getById(req.params.id);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    const components = Component.getByBuildId(build.id);

    res.json({ 
      build: {
        ...build,
        components
      }
    });
  } catch (error) {
    console.error('Admin get build error:', error);
    res.status(500).json({ error: { message: 'Errore nel recupero della build' } });
  }
});

// Crea nuova build
router.post('/builds', (req, res) => {
  try {
    const { title, description, content, featured_image, budget, category, status, meta_title, meta_description, affiliate_tag, components } = req.body;

    if (!title) {
      return res.status(400).json({ error: { message: 'Il titolo è obbligatorio' } });
    }

    const result = Build.create({
      title,
      description,
      content,
      featured_image,
      budget,
      category,
      status: status || 'draft',
      meta_title,
      meta_description,
      affiliate_tag,
      author_id: req.user.id
    });

    // Aggiungi componenti se presenti
    if (components && Array.isArray(components) && components.length > 0) {
      Component.bulkCreate(result.id, components);
    }

    const build = Build.getById(result.id);
    const buildComponents = Component.getByBuildId(result.id);

    res.status(201).json({ 
      message: 'Build creata con successo',
      build: {
        ...build,
        components: buildComponents
      }
    });
  } catch (error) {
    console.error('Create build error:', error);
    res.status(500).json({ error: { message: 'Errore nella creazione della build' } });
  }
});

// Aggiorna build
router.put('/builds/:id', (req, res) => {
  try {
    const buildId = req.params.id;
    const build = Build.getById(buildId);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    const { title, description, content, featured_image, budget, category, status, meta_title, meta_description, affiliate_tag, components } = req.body;

    Build.update(buildId, {
      title,
      description,
      content,
      featured_image,
      budget,
      category,
      status,
      meta_title,
      meta_description,
      affiliate_tag
    });

    // Aggiorna componenti se presenti
    if (components && Array.isArray(components)) {
      // Elimina componenti esistenti e ricrea
      Component.deleteByBuildId(buildId);
      if (components.length > 0) {
        Component.bulkCreate(buildId, components);
      }
    }

    const updatedBuild = Build.getById(buildId);
    const buildComponents = Component.getByBuildId(buildId);

    res.json({ 
      message: 'Build aggiornata con successo',
      build: {
        ...updatedBuild,
        components: buildComponents
      }
    });
  } catch (error) {
    console.error('Update build error:', error);
    res.status(500).json({ error: { message: 'Errore nell\'aggiornamento della build' } });
  }
});

// Elimina build
router.delete('/builds/:id', (req, res) => {
  try {
    const build = Build.getById(req.params.id);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    Build.delete(req.params.id);

    res.json({ message: 'Build eliminata con successo' });
  } catch (error) {
    console.error('Delete build error:', error);
    res.status(500).json({ error: { message: 'Errore nell\'eliminazione della build' } });
  }
});

// Upload immagine
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Nessun file caricato' } });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({ 
      message: 'Immagine caricata con successo',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Errore nel caricamento dell\'immagine' } });
  }
});

// Statistiche dashboard
router.get('/stats', (req, res) => {
  try {
    const allBuilds = Build.getAll();
    const published = allBuilds.filter(b => b.status === 'published').length;
    const drafts = allBuilds.filter(b => b.status === 'draft').length;
    const totalViews = allBuilds.reduce((sum, b) => sum + (b.views || 0), 0);

    res.json({
      stats: {
        total: allBuilds.length,
        published,
        drafts,
        totalViews
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: { message: 'Errore nel recupero delle statistiche' } });
  }
});

// Importa componenti da link carrello Amazon
router.post('/import-amazon', async (req, res) => {
  try {
    const { cartUrl } = req.body;

    if (!cartUrl) {
      return res.status(400).json({ error: { message: 'URL del carrello Amazon mancante' } });
    }

    // Verifica che sia un URL Amazon valido
    if (!cartUrl.includes('amazon.') || !cartUrl.includes('cart/add')) {
      return res.status(400).json({ error: { message: 'URL non valido. Fornisci un link di carrello Amazon.' } });
    }

    console.log('Importazione componenti da Amazon:', cartUrl);

    // Estrai il dominio Amazon dall'URL (es. amazon.it, amazon.com, etc.)
    const domainMatch = cartUrl.match(/amazon\.([a-z.]+)/);
    const domain = domainMatch ? `amazon.${domainMatch[1]}` : 'amazon.it';

    // Importa i componenti e l'affiliate tag
    const { components, affiliateTag } = await importFromAmazonCart(cartUrl, domain);

    res.json({ 
      message: `Importati ${components.length} componenti con successo`,
      components,
      affiliateTag
    });
  } catch (error) {
    console.error('Import Amazon error:', error);
    res.status(500).json({ 
      error: { 
        message: error.message || 'Errore nell\'importazione dei componenti da Amazon' 
      } 
    });
  }
});

export default router;
