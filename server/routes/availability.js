import express from 'express';
import { Component } from '../models/Component.js';
import { Build } from '../models/Build.js';
import { checkAndReplaceComponents, regenerateAmazonCart, restoreOriginalComponent, getReplacementStats, checkAllBuilds } from '../utils/smartReplacer.js';
import { checkComponentAvailability, checkMultipleComponentsAvailability } from '../utils/availabilityChecker.js';
import { findAlternativeByQuery, validateSearchQuery, suggestSearchQueries, searchAmazonProducts } from '../utils/alternativeFinder.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/builds/:id/availability
 * Controlla la disponibilità di tutti i componenti di una build
 */
router.get('/builds/:id/availability', async (req, res) => {
  try {
    const buildId = parseInt(req.params.id);
    
    if (isNaN(buildId)) {
      return res.status(400).json({ error: 'ID build non valido' });
    }
    
    const components = await Component.getByBuildId(buildId);
    
    if (components.length === 0) {
      return res.json({
        success: true,
        buildId,
        components: [],
        message: 'Nessun componente trovato'
      });
    }
    
    const availabilityResults = await checkMultipleComponentsAvailability(components);
    
    // Aggiorna disponibilità nel database
    for (const result of availabilityResults) {
      await Component.updateAvailability(
        result.componentId,
        result.available,
        result.lastChecked
      );
    }
    
    res.json({
      success: true,
      buildId,
      checked: availabilityResults.length,
      available: availabilityResults.filter(r => r.available).length,
      unavailable: availabilityResults.filter(r => !r.available).length,
      results: availabilityResults
    });
    
  } catch (error) {
    console.error('Errore nel controllo disponibilità:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/builds/:id/check-and-replace
 * Controlla e sostituisce automaticamente i componenti non disponibili
 */
router.post('/builds/:id/check-and-replace', authenticateToken, async (req, res) => {
  try {
    const buildId = parseInt(req.params.id);
    
    if (isNaN(buildId)) {
      return res.status(400).json({ error: 'ID build non valido' });
    }
    
    // Verifica che la build esista
    const build = await Build.getById(buildId);
    if (!build) {
      return res.status(404).json({ error: 'Build non trovata' });
    }
    
    const result = await checkAndReplaceComponents(buildId);
    
    res.json({
      success: result.success,
      message: result.message,
      buildId,
      replaced: result.replaced,
      checked: result.checked,
      results: result.results
    });
    
  } catch (error) {
    console.error('Errore nel controllo e sostituzione:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/components/:id/alternatives
 * Cerca alternative per un componente specifico
 */
router.get('/components/:id/alternatives', async (req, res) => {
  try {
    const componentId = parseInt(req.params.id);
    
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'ID componente non valido' });
    }
    
    const component = await Component.getById(componentId);
    
    if (!component) {
      return res.status(404).json({ error: 'Componente non trovato' });
    }
    
    if (!component.search_query) {
      return res.json({
        success: true,
        componentId,
        alternatives: [],
        message: 'Nessuna query di ricerca configurata'
      });
    }
    
    const alternative = await findAlternativeByQuery(component);
    
    res.json({
      success: true,
      componentId,
      originalComponent: {
        id: component.id,
        name: component.name,
        price: component.price,
        amazonLink: component.amazon_link,
        searchQuery: component.search_query
      },
      alternative: alternative,
      hasAlternative: alternative !== null
    });
    
  } catch (error) {
    console.error('Errore nella ricerca alternative:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/components/:id/test-search
 * Testa una query di ricerca per un componente
 */
router.post('/components/:id/test-search', authenticateToken, async (req, res) => {
  try {
    const componentId = parseInt(req.params.id);
    const { searchQuery } = req.body;
    
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'ID componente non valido' });
    }
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Query di ricerca richiesta' });
    }
    
    // Valida la query
    const validation = validateSearchQuery(searchQuery);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const component = await Component.getById(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Componente non trovato' });
    }
    
    // Testa la ricerca
    const results = await searchAmazonProducts(searchQuery, component.type);
    
    res.json({
      success: true,
      componentId,
      searchQuery,
      resultsCount: results.length,
      results: results.slice(0, 5) // Limita a 5 risultati per il test
    });
    
  } catch (error) {
    console.error('Errore nel test ricerca:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/components/:id/search-query
 * Aggiorna la query di ricerca per un componente
 */
router.put('/components/:id/search-query', authenticateToken, async (req, res) => {
  try {
    const componentId = parseInt(req.params.id);
    const { searchQuery } = req.body;
    
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'ID componente non valido' });
    }
    
    if (searchQuery !== null && searchQuery !== undefined) {
      const validation = validateSearchQuery(searchQuery);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    const component = await Component.getById(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Componente non trovato' });
    }
    
    await Component.update(componentId, { search_query: searchQuery });
    
    res.json({
      success: true,
      message: 'Query di ricerca aggiornata',
      componentId,
      searchQuery
    });
    
  } catch (error) {
    console.error('Errore nell\'aggiornamento query:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/components/:id/search-suggestions
 * Ottiene suggerimenti per query di ricerca
 */
router.get('/components/:id/search-suggestions', async (req, res) => {
  try {
    const componentId = parseInt(req.params.id);
    
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'ID componente non valido' });
    }
    
    const component = await Component.getById(componentId);
    
    if (!component) {
      return res.status(404).json({ error: 'Componente non trovato' });
    }
    
    const suggestions = suggestSearchQueries(component.type, component.name);
    
    res.json({
      success: true,
      componentId,
      componentType: component.type,
      componentName: component.name,
      suggestions
    });
    
  } catch (error) {
    console.error('Errore nel recupero suggerimenti:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/builds/:id/regenerate-cart
 * Rigenera il carrello Amazon per una build
 */
router.get('/builds/:id/regenerate-cart', async (req, res) => {
  try {
    const buildId = parseInt(req.params.id);
    
    if (isNaN(buildId)) {
      return res.status(400).json({ error: 'ID build non valido' });
    }
    
    const build = await Build.getById(buildId);
    if (!build) {
      return res.status(404).json({ error: 'Build non trovata' });
    }
    
    const cartUrl = await regenerateAmazonCart(buildId);
    
    res.json({
      success: true,
      buildId,
      cartUrl,
      message: 'Carrello Amazon rigenerato'
    });
    
  } catch (error) {
    console.error('Errore nella rigenerazione carrello:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/builds/:id/replacement-stats
 * Ottiene statistiche delle sostituzioni per una build
 */
router.get('/builds/:id/replacement-stats', async (req, res) => {
  try {
    const buildId = parseInt(req.params.id);
    
    if (isNaN(buildId)) {
      return res.status(400).json({ error: 'ID build non valido' });
    }
    
    const stats = await getReplacementStats(buildId);
    
    res.json({
      success: true,
      buildId,
      stats
    });
    
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/components/:id/restore
 * Ripristina un componente sostituito al componente originale
 */
router.post('/components/:id/restore', authenticateToken, async (req, res) => {
  try {
    const componentId = parseInt(req.params.id);
    
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'ID componente non valido' });
    }
    
    const result = await restoreOriginalComponent(componentId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.json({
      success: true,
      componentId,
      message: result.message
    });
    
  } catch (error) {
    console.error('Errore nel ripristino componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/check-all-builds
 * Controlla tutte le build del sistema (endpoint admin)
 */
router.post('/admin/check-all-builds', authenticateToken, async (req, res) => {
  try {
    const result = await checkAllBuilds();
    
    res.json({
      success: result.success,
      message: result.message || 'Controllo globale completato',
      totalChecked: result.totalChecked,
      totalReplaced: result.totalReplaced,
      buildsAffected: result.buildsAffected || 0,
      results: result.results || []
    });
    
  } catch (error) {
    console.error('Errore nel controllo globale:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/replacement-overview
 * Panoramica generale delle sostituzioni (endpoint admin)
 */
router.get('/admin/replacement-overview', authenticateToken, async (req, res) => {
  try {
    const unavailableComponents = await Component.getUnavailableComponents();
    const builds = await Build.getAll();
    
    const overview = {
      totalBuilds: builds.length,
      unavailableComponents: unavailableComponents.length,
      componentsNeedingReplacement: unavailableComponents.filter(c => !c.is_replacement && !c.search_query).length,
      recentReplacements: unavailableComponents.filter(c => c.is_replacement).slice(0, 10)
    };
    
    res.json({
      success: true,
      overview
    });
    
  } catch (error) {
    console.error('Errore nel recupero panoramica:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
