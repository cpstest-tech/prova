import express from 'express';
import { Build } from '../models/Build.js';
import { Component } from '../models/Component.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { importFromAmazonCart } from '../utils/amazonParser.js';
import { ProductSubstitution } from '../utils/productSubstitution.js';
import { PriceChecker } from '../utils/priceChecker.js';
import database from '../config/database.js';

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
    console.log('📤 Upload attempt:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      } : null,
      body: req.body,
      headers: {
        'content-type': req.get('content-type'),
        'content-length': req.get('content-length')
      }
    });

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: { message: 'Nessun file caricato' } });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    console.log('✅ Upload successful:', {
      filename: req.file.filename,
      size: req.file.size,
      url: imageUrl
    });

    res.json({ 
      message: 'Immagine caricata con successo',
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Gestione errori specifici per AWS EC2
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: { 
          message: 'File troppo grande. Dimensione massima: 50MB',
          code: 'LIMIT_FILE_SIZE',
          limit: process.env.MAX_FILE_SIZE || '50MB'
        } 
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: { 
          message: 'Troppi file caricati. Massimo 1 file per volta.',
          code: 'LIMIT_UNEXPECTED_FILE'
        } 
      });
    }

    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(413).json({ 
        error: { 
          message: 'Troppe parti nel form. Riduci i campi del form.',
          code: 'LIMIT_PART_COUNT'
        } 
      });
    }

    if (error.code === 'LIMIT_FIELD_COUNT') {
      return res.status(413).json({ 
        error: { 
          message: 'Troppi campi nel form. Riduci i campi del form.',
          code: 'LIMIT_FIELD_COUNT'
        } 
      });
    }

    res.status(500).json({ 
      error: { 
        message: 'Errore nel caricamento dell\'immagine',
        code: error.code || 'UNKNOWN_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
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

// ========== ROUTE PER SOSTITUZIONE INTELLIGENTE ==========

// Controlla e aggiorna tutti i prezzi
router.post('/check-prices', async (req, res) => {
  try {
    const { buildId } = req.body;
    
    console.log(`🔄 Avvio controllo prezzi${buildId ? ` per build ${buildId}` : ' (tutte le build)'}`);
    
    const substitution = new ProductSubstitution();
    
    let result;
    if (buildId) {
      result = await substitution.checkAndUpdateBuild(buildId);
    } else {
      result = await substitution.checkAllPublishedBuilds();
    }
    
    await substitution.cleanup();
    
    res.json({
      message: 'Controllo prezzi completato',
      result
    });
  } catch (error) {
    console.error('Check prices error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Errore nel controllo dei prezzi'
      }
    });
  }
});

// Controlla un singolo componente
router.post('/components/:id/check', async (req, res) => {
  try {
    const component = Component.getById(req.params.id);
    
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }
    
    const substitution = new ProductSubstitution();
    const result = await substitution.checkAndUpdateComponent(component);
    await substitution.cleanup();
    
    res.json({
      message: 'Controllo completato',
      result
    });
  } catch (error) {
    console.error('Check component error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Errore nel controllo del componente'
      }
    });
  }
});

// Trova manualmente un sostituto per un componente
router.post('/components/:id/find-substitute', async (req, res) => {
  try {
    const component = Component.getById(req.params.id);
    
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }
    
    if (!component.searchterm) {
      return res.status(400).json({ 
        error: { message: 'Searchterm mancante. Aggiungi un termine di ricerca al componente.' } 
      });
    }
    
    const { priceThreshold } = req.body;
    const threshold = priceThreshold || 15;
    
    const substitution = new ProductSubstitution();
    const substitute = await substitution.findSubstitute(component, threshold);
    await substitution.cleanup();
    
    if (!substitute) {
      return res.status(404).json({
        error: { message: 'Nessun prodotto sostitutivo trovato nel range di prezzo specificato' }
      });
    }
    
    res.json({
      message: 'Sostituto trovato',
      substitute
    });
  } catch (error) {
    console.error('Find substitute error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Errore nella ricerca del sostituto'
      }
    });
  }
});

// Applica manualmente una sostituzione
router.post('/components/:id/substitute', async (req, res) => {
  try {
    const component = Component.getById(req.params.id);
    
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }
    
    const { substitute, reason } = req.body;
    
    if (!substitute) {
      return res.status(400).json({ error: { message: 'Dati del sostituto mancanti' } });
    }
    
    // Aggiorna il componente
    Component.update(req.params.id, {
      name: substitute.name,
      brand: substitute.brand,
      model: substitute.model,
      price: substitute.price,
      amazon_link: substitute.amazon_link,
      image_url: substitute.image_url || component.image_url,
      specs: substitute.specs || component.specs,
      is_substituted: 1,
      substitution_reason: reason || 'Sostituzione manuale',
      original_price: component.original_price || component.price,
      last_price_check: new Date().toISOString()
    });
    
    const updated = Component.getById(req.params.id);
    
    res.json({
      message: 'Componente sostituito con successo',
      component: updated
    });
  } catch (error) {
    console.error('Substitute component error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Errore nella sostituzione del componente'
      }
    });
  }
});

// Ripristina prodotto originale
router.post('/components/:id/restore', async (req, res) => {
  try {
    const substitution = new ProductSubstitution();
    const result = await substitution.restoreOriginalProduct(req.params.id);
    await substitution.cleanup();
    
    const component = Component.getById(req.params.id);
    
    res.json({
      message: result ? 'Componente ripristinato con successo' : 'Errore nel ripristino',
      success: result,
      component
    });
  } catch (error) {
    console.error('Restore component error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Errore nel ripristino del componente'
      }
    });
  }
});

// Ottieni statistiche sostituzioni
router.get('/substitution-stats', (req, res) => {
  try {
    
    const stats = {
      totalComponents: database.prepare('SELECT COUNT(*) as count FROM components').get().count,
      substitutedComponents: database.prepare('SELECT COUNT(*) as count FROM components WHERE is_substituted = 1').get().count,
      totalBuilds: database.prepare('SELECT COUNT(*) as count FROM builds WHERE status = "published"').get().count,
      buildsWithSubstitutions: database.prepare(`
        SELECT COUNT(DISTINCT build_id) as count 
        FROM components 
        WHERE is_substituted = 1
      `).get().count,
      recentSubstitutions: database.prepare(`
        SELECT COUNT(*) as count 
        FROM components 
        WHERE is_substituted = 1 AND last_price_check > datetime('now', '-7 days')
      `).get().count
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Substitution stats error:', error);
    res.status(500).json({
      error: {
        message: 'Errore nel recupero delle statistiche'
      }
    });
  }
});

// Aggiorna searchterm di un componente
router.patch('/components/:id/searchterm', (req, res) => {
  try {
    const { searchterm } = req.body;
    
    const component = Component.getById(req.params.id);
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }
    
    Component.update(req.params.id, { searchterm });
    
    const updated = Component.getById(req.params.id);
    
    res.json({
      message: 'Searchterm aggiornato',
      component: updated
    });
  } catch (error) {
    console.error('Update searchterm error:', error);
    res.status(500).json({
      error: {
        message: 'Errore nell\'aggiornamento del searchterm'
      }
    });
  }
});

// Genera carrello Amazon aggiornato con sostituzioni
router.post('/builds/:id/generate-cart', (req, res) => {
  try {
    const build = Build.getById(req.params.id);
    
    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    const components = Component.getByBuildId(build.id);
    
    if (components.length === 0) {
      return res.status(400).json({ error: { message: 'Nessun componente trovato nella build' } });
    }

    // Estrai ASIN dai componenti (inclusi quelli sostituiti)
    const asins = [];
    const substitutions = [];
    
    components.forEach((component, index) => {
      if (component.amazon_link) {
        const asin = component.amazon_link.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
        if (asin) {
          const asinCode = asin[1] || asin[2] || asin[3];
          asins.push({
            asin: asinCode,
            component: component.name,
            price: component.price,
            isSubstituted: component.is_substituted === 1,
            substitutionReason: component.substitution_reason
          });
          
          if (component.is_substituted === 1) {
            substitutions.push({
              original: component.name,
              reason: component.substitution_reason,
              price: component.price
            });
          }
        }
      }
    });

    if (asins.length === 0) {
      return res.status(400).json({ error: { message: 'Nessun link Amazon valido trovato' } });
    }

    // Genera URL carrello Amazon
    const baseUrl = 'https://www.amazon.it/gp/aws/cart/add.html';
    const affiliateTag = build.affiliate_tag || 'cpstest05-21';
    
    const params = new URLSearchParams();
    params.append('AssociateTag', affiliateTag);
    
    asins.forEach((item, index) => {
      params.append(`ASIN.${index + 1}`, item.asin);
      params.append(`Quantity.${index + 1}`, '1');
    });

    const cartUrl = `${baseUrl}?${params.toString()}`;

    res.json({
      cartUrl,
      affiliateTag,
      totalComponents: asins.length,
      substitutions: substitutions.length > 0 ? substitutions : null,
      components: asins.map(item => ({
        name: item.component,
        asin: item.asin,
        price: item.price,
        isSubstituted: item.isSubstituted,
        reason: item.substitutionReason
      }))
    });

  } catch (error) {
    console.error('Generate cart error:', error);
    res.status(500).json({
      error: {
        message: 'Errore nella generazione del carrello'
      }
    });
  }
});

export default router;
