import express from 'express';
import { Build } from '../models/Build.js';
import { Component } from '../models/Component.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { importFromAmazonCart } from '../utils/amazonParser.js';
import { updatePricesForBuild, updatePricesForTier, autoAssignTiers } from '../utils/priceUpdater.js';
import { getSchedulerStatus, runManualUpdate } from '../utils/priceScheduler.js';
import ComponentAlternatives from '../utils/componentAlternatives.js';
import { AlternativeCategory } from '../models/AlternativeCategory.js';
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

// Aggiorna prezzi per una build specifica (Tier C on-demand)
router.post('/builds/:id/update-prices', async (req, res) => {
  try {
    const buildId = req.params.id;
    const build = Build.getById(buildId);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    console.log(`Aggiornamento prezzi richiesto per build ${buildId}`);

    const results = await updatePricesForBuild(buildId);

    res.json({
      message: `Aggiornamento prezzi completato per build ${buildId}`,
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Update build prices error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento dei prezzi della build' 
      } 
    });
  }
});

// Aggiorna prezzi per tier specifico (manuale)
router.post('/prices/update-tier/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    
    if (!['A', 'B'].includes(tier)) {
      return res.status(400).json({ 
        error: { message: 'Tier deve essere A o B per aggiornamenti manuali' } 
      });
    }

    console.log(`Aggiornamento manuale prezzi Tier ${tier} richiesto`);

    const results = await runManualUpdate(tier);

    res.json({
      message: `Aggiornamento manuale Tier ${tier} completato`,
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Update tier prices error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento dei prezzi del tier' 
      } 
    });
  }
});

// Assegna automaticamente i tier ai componenti
router.post('/components/assign-tiers', async (req, res) => {
  try {
    console.log('Assegnazione automatica tier richiesta');

    const assigned = autoAssignTiers();

    res.json({
      message: `Assegnazione automatica tier completata`,
      assigned
    });
  } catch (error) {
    console.error('Assign tiers error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'assegnazione automatica dei tier' 
      } 
    });
  }
});

// Statistiche sistema prezzi
router.get('/prices/stats', (req, res) => {
  try {
    const stats = database.prepare(`
      SELECT 
        tier,
        COUNT(*) as total,
        COUNT(CASE WHEN asin IS NOT NULL THEN 1 END) as with_asin,
        COUNT(CASE WHEN price IS NOT NULL THEN 1 END) as with_price,
        COUNT(CASE WHEN price_updated_at IS NOT NULL THEN 1 END) as updated
      FROM components 
      GROUP BY tier
    `).all();

    const cacheStats = database.prepare(`
      SELECT 
        COUNT(*) as total_cached,
        COUNT(CASE WHEN expires_at > ? THEN 1 END) as valid_cache
      FROM price_cache
    `).get(new Date().toISOString());

    const schedulerStatus = getSchedulerStatus();

    res.json({
      componentStats: stats,
      cacheStats,
      scheduler: schedulerStatus
    });
  } catch (error) {
    console.error('Price stats error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero delle statistiche prezzi' 
      } 
    });
  }
});

// Aggiorna tier di un componente specifico
router.put('/components/:id/tier', (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!['A', 'B', 'C'].includes(tier)) {
      return res.status(400).json({ 
        error: { message: 'Tier deve essere A, B o C' } 
      });
    }

    const component = Component.getById(id);
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }

    Component.setTier(id, tier);

    res.json({
      message: `Tier del componente aggiornato a ${tier}`,
      component: Component.getById(id)
    });
  } catch (error) {
    console.error('Update component tier error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento del tier del componente' 
      } 
    });
  }
});

// Gestione categorie alternative
router.get('/alternative-categories', (req, res) => {
  try {
    const categories = AlternativeCategory.getAll();
    const stats = AlternativeCategory.getStats();
    res.json({ categories, stats });
  } catch (error) {
    console.error('Get alternative categories error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero delle categorie alternative' 
      } 
    });
  }
});

router.get('/alternative-categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const category = AlternativeCategory.getWithAlternatives(id);
    
    if (!category) {
      return res.status(404).json({ error: { message: 'Categoria non trovata' } });
    }
    
    res.json({ category });
  } catch (error) {
    console.error('Get alternative category error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero della categoria' 
      } 
    });
  }
});

router.post('/alternative-categories', (req, res) => {
  try {
    const { name, description, component_type } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: { message: 'Il nome della categoria è obbligatorio' } 
      });
    }

    const result = AlternativeCategory.create({
      name,
      description,
      component_type
    });

    res.json({
      message: 'Categoria creata con successo',
      id: result
    });
  } catch (error) {
    console.error('Create alternative category error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nella creazione della categoria' 
      } 
    });
  }
});

router.put('/alternative-categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, component_type } = req.body;

    const category = AlternativeCategory.getById(id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Categoria non trovata' } });
    }

    AlternativeCategory.update(id, {
      name,
      description,
      component_type
    });

    res.json({
      message: 'Categoria aggiornata con successo',
      category: AlternativeCategory.getById(id)
    });
  } catch (error) {
    console.error('Update alternative category error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento della categoria' 
      } 
    });
  }
});

router.delete('/alternative-categories/:id', (req, res) => {
  try {
    const { id } = req.params;

    const category = AlternativeCategory.getById(id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Categoria non trovata' } });
    }

    AlternativeCategory.delete(id);

    res.json({ message: 'Categoria eliminata con successo' });
  } catch (error) {
    console.error('Delete alternative category error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'eliminazione della categoria' 
      } 
    });
  }
});

// Gestione alternative componenti
router.get('/alternatives', (req, res) => {
  try {
    const stats = ComponentAlternatives.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get alternatives stats error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero delle statistiche alternative' 
      } 
    });
  }
});

router.get('/alternatives/:asin', (req, res) => {
  try {
    const { asin } = req.params;
    const alternatives = ComponentAlternatives.getAlternatives(asin);
    res.json({ alternatives });
  } catch (error) {
    console.error('Get alternatives error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero delle alternative' 
      } 
    });
  }
});

// Gestione alternative per categoria
router.get('/alternative-categories/:id/alternatives', (req, res) => {
  try {
    const { id } = req.params;
    const alternatives = ComponentAlternatives.getAlternativesByCategory(id);
    res.json({ alternatives });
  } catch (error) {
    console.error('Get category alternatives error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nel recupero delle alternative della categoria' 
      } 
    });
  }
});

router.post('/alternative-categories/:id/alternatives', async (req, res) => {
  try {
    const { id } = req.params;
    const { alternativeAsin, alternativeName, alternativePrice, priority } = req.body;

    if (!alternativeAsin || !alternativeName) {
      return res.status(400).json({ 
        error: { message: 'ASIN alternativa e nome sono obbligatori' } 
      });
    }

    const result = await ComponentAlternatives.addAlternative(
      null, // originalAsin non necessario per categorie
      alternativeAsin,
      alternativeName,
      alternativePrice || null,
      priority || 1,
      id
    );

    res.json({
      message: 'Alternativa aggiunta con successo alla categoria',
      id: result
    });
  } catch (error) {
    console.error('Add category alternative error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiunta dell\'alternativa alla categoria' 
      } 
    });
  }
});

router.put('/alternatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { alternativeAsin, alternativeName, alternativePrice, priority, is_active } = req.body;

    ComponentAlternatives.updateAlternative(id, {
      alternative_asin: alternativeAsin,
      alternative_name: alternativeName,
      alternative_price: alternativePrice,
      priority,
      is_active
    });

    res.json({
      message: 'Alternativa aggiornata con successo'
    });
  } catch (error) {
    console.error('Update alternative error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento dell\'alternativa' 
      } 
    });
  }
});

router.post('/alternatives', async (req, res) => {
  try {
    const { originalAsin, alternativeAsin, alternativeName, alternativePrice, priority } = req.body;

    if (!originalAsin || !alternativeAsin || !alternativeName) {
      return res.status(400).json({ 
        error: { message: 'ASIN originale, ASIN alternativa e nome sono obbligatori' } 
      });
    }

    const result = await ComponentAlternatives.addAlternative(
      originalAsin,
      alternativeAsin,
      alternativeName,
      alternativePrice || null,
      priority || 1
    );

    res.json({
      message: 'Alternativa aggiunta con successo',
      id: result
    });
  } catch (error) {
    console.error('Add alternative error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiunta dell\'alternativa' 
      } 
    });
  }
});

router.delete('/alternatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ComponentAlternatives.removeAlternative(id);
    res.json({ message: 'Alternativa rimossa con successo' });
  } catch (error) {
    console.error('Remove alternative error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nella rimozione dell\'alternativa' 
      } 
    });
  }
});

router.post('/alternatives/initialize', async (req, res) => {
  try {
    const added = await ComponentAlternatives.initializeDefaultAlternatives();
    res.json({
      message: `Inizializzate ${added} alternative predefinite`,
      added
    });
  } catch (error) {
    console.error('Initialize alternatives error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'inizializzazione delle alternative' 
      } 
    });
  }
});

router.post('/alternatives/update-prices', async (req, res) => {
  try {
    const updated = await ComponentAlternatives.updateAllAlternativePrices();
    res.json({
      message: `Aggiornati ${updated} prezzi alternative`,
      updated
    });
  } catch (error) {
    console.error('Update alternative prices error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'aggiornamento dei prezzi delle alternative' 
      } 
    });
  }
});

// Verifica disponibilità e sostituzione intelligente per un componente
router.post('/components/:id/check-availability', async (req, res) => {
  try {
    const { id } = req.params;
    const component = Component.getById(id);
    
    if (!component) {
      return res.status(404).json({ error: { message: 'Componente non trovato' } });
    }

    if (!component.asin) {
      return res.status(400).json({ 
        error: { message: 'Componente non ha un ASIN Amazon' } 
      });
    }

    console.log(`🔍 Verifica disponibilità per componente ${component.name} (${component.asin})`);

    // Prova a recuperare il prezzo del componente originale
    const { fetchPrice } = await import('../utils/priceUpdater.js');
    const priceData = await fetchPrice(component.asin, true);

    if (priceData.price && !priceData.isFallback) {
      // Componente disponibile, aggiorna il prezzo
      Component.updatePrice(component.asin, {
        price: priceData.price,
        source: priceData.source,
        last_checked: priceData.last_checked,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      res.json({
        available: true,
        message: 'Componente disponibile',
        priceData,
        component: Component.getById(id)
      });
    } else {
      // Componente non disponibile, cerca alternativa
      console.log(`⚠️ Componente ${component.name} non disponibile, ricerca alternativa...`);
      
      const fallback = await ComponentAlternatives.handlePriceFallback(component);
      
      if (fallback) {
        res.json({
          available: false,
          replaced: true,
          message: `Componente sostituito intelligentemente con: ${fallback.name}`,
          originalComponent: component,
          replacement: {
            asin: fallback.asin,
            name: fallback.name,
            price: fallback.price,
            source: fallback.source,
            url: fallback.url
          },
          fallbackInfo: {
            originalAsin: component.asin,
            alternativeAsin: fallback.asin,
            alternativeName: fallback.name,
            reason: 'Prodotto originale non disponibile'
          }
        });
      } else {
        res.json({
          available: false,
          replaced: false,
          message: 'Componente non disponibile e nessuna alternativa trovata',
          originalComponent: component
        });
      }
    }
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nella verifica della disponibilità del componente' 
      } 
    });
  }
});

// Applica sostituzione intelligente a una build
router.post('/builds/:id/smart-replacement', async (req, res) => {
  try {
    const buildId = req.params.id;
    const build = Build.getById(buildId);

    if (!build) {
      return res.status(404).json({ error: { message: 'Build non trovata' } });
    }

    console.log(`🔄 Applicazione sostituzione intelligente per build ${buildId}`);

    const components = Component.getByBuildId(buildId).filter(c => c.asin);
    const results = [];

    for (const component of components) {
      try {
        console.log(`\n--- Verifica ${component.name} (${component.asin}) ---`);
        
        const { fetchPrice } = await import('../utils/priceUpdater.js');
        const priceData = await fetchPrice(component.asin, true);

        if (priceData.price && !priceData.isFallback) {
          // Componente disponibile
          results.push({
            componentId: component.id,
            componentName: component.name,
            asin: component.asin,
            status: 'available',
            price: priceData.price,
            source: priceData.source,
            message: 'Componente disponibile'
          });
        } else {
          // Componente non disponibile, cerca alternativa
          const fallback = await ComponentAlternatives.handlePriceFallback(component);
          
          if (fallback) {
            // Applica la sostituzione nel database
            Component.update(component.id, {
              name: fallback.name,
              amazon_link: fallback.url || `https://www.amazon.it/dp/${fallback.asin}`,
              price: fallback.price,
              asin: fallback.asin,
              specs: `${component.specs || ''}\n\n[SOSTITUZIONE INTELLIGENTE] Sostituito automaticamente da ${component.name}`.trim()
            });
            
            console.log(`✅ Sostituito nel database: ${component.name} → ${fallback.name}`);
            
            results.push({
              componentId: component.id,
              componentName: component.name,
              asin: component.asin,
              status: 'replaced',
              replacement: {
                asin: fallback.asin,
                name: fallback.name,
                price: fallback.price,
                source: fallback.source,
                url: fallback.url
              },
              message: `Sostituito intelligentemente con: ${fallback.name}`
            });
          } else {
            results.push({
              componentId: component.id,
              componentName: component.name,
              asin: component.asin,
              status: 'unavailable',
              message: 'Non disponibile e nessuna alternativa trovata'
            });
          }
        }

        // Delay tra verifiche per evitare detection
        await new Promise(resolve => setTimeout(resolve, 15000 + Math.random() * 15000)); // 15-30 secondi
        
      } catch (error) {
        console.error(`❌ Errore verifica ${component.name}:`, error.message);
        results.push({
          componentId: component.id,
          componentName: component.name,
          asin: component.asin,
          status: 'error',
          error: error.message,
          message: 'Errore nella verifica'
        });
      }
    }

    const summary = {
      total: results.length,
      available: results.filter(r => r.status === 'available').length,
      replaced: results.filter(r => r.status === 'replaced').length,
      unavailable: results.filter(r => r.status === 'unavailable').length,
      errors: results.filter(r => r.status === 'error').length
    };

    res.json({
      message: `Sostituzione intelligente completata per build ${buildId}`,
      results,
      summary
    });
  } catch (error) {
    console.error('Smart replacement error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Errore nell\'applicazione della sostituzione intelligente' 
      } 
    });
  }
});


export default router;
