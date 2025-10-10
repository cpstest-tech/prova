import express from 'express';
import { Build } from '../models/Build.js';

const router = express.Router();

// Sitemap XML
router.get('/sitemap.xml', (req, res) => {
  try {
    const builds = Build.getPublished();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/</loc>\n`;
    sitemap += '    <changefreq>daily</changefreq>\n';
    sitemap += '    <priority>1.0</priority>\n';
    sitemap += '  </url>\n';

    // Build pages
    builds.forEach(build => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}/build/${build.slug}</loc>\n`;
      sitemap += `    <lastmod>${new Date(build.updated_at).toISOString()}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Errore nella generazione della sitemap');
  }
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;
