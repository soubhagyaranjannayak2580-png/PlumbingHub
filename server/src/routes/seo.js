import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { query, one } from '../db.js';
import { getBusiness } from '../lib/settings.js';
import { AREA_PAGES } from '../content/areas.js';

const router = Router();

const STATIC_ROUTES = [
  ['/', '1.0', 'weekly'],
  ['/services', '0.9', 'monthly'],
  ['/system', '0.6', 'monthly'],
  ['/projects', '0.8', 'weekly'],
  ['/book', '0.9', 'monthly'],
  ['/emergency', '0.9', 'monthly'],
  ['/contact', '0.8', 'monthly'],
];

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const [services, projects] = await Promise.all([
      query('SELECT slug, updated_at FROM services WHERE published'),
      query('SELECT slug, updated_at FROM projects WHERE published'),
    ]);
    const urls = [
      ...STATIC_ROUTES.map(([p, priority, freq]) => ({ loc: p, priority, freq })),
      ...AREA_PAGES.map((a) => ({ loc: `/plumbing-contractor/${a.slug}`, priority: '0.8', freq: 'monthly' })),
      ...services.rows.map((s) => ({ loc: `/services/${s.slug}`, priority: '0.8', freq: 'monthly', lastmod: s.updated_at })),
      ...projects.rows.map((p) => ({ loc: `/projects/${p.slug}`, priority: '0.6', freq: 'monthly', lastmod: p.updated_at })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${config.siteUrl}${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------------------------------------
 * Production only: serve the built SPA and inject route-specific <title>, description,
 * canonical and Open Graph tags into the HTML so crawlers and link previews get correct
 * metadata before JavaScript runs. (react-helmet-async takes over these tags client-side.)
 * ------------------------------------------------------------------------- */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function metaFor(urlPath, business) {
  const brand = business.legalName || `${business.companyName} Plumbing & Engineering`;
  const base = {
    title: `Plumbing Contractor in Delhi NCR | ${brand}`,
    description:
      'Professional plumbing contractor for residential, commercial and industrial projects across Delhi, Gurugram, Noida, Faridabad and Greater Noida. Request a free quote.',
  };
  const p = urlPath.replace(/\/+$/, '') || '/';
  const fixed = {
    '/services': {
      title: `Plumbing Services in Delhi NCR – Residential, Commercial & Industrial | ${brand}`,
      description: 'Residential, commercial and industrial plumbing, bathroom & kitchen installation, water supply, drainage, maintenance and MEP plumbing across Delhi NCR.',
    },
    '/system': { title: `Interactive 3D Building Plumbing System | ${brand}`, description: 'Explore how water supply, hot water, drainage and storage work in a building with an interactive 3D model.' },
    '/projects': { title: `Plumbing Projects Portfolio | ${brand}`, description: 'Residential, commercial, industrial, bathroom, water supply and drainage projects delivered across Delhi NCR.' },
    '/book': { title: `Book a Plumber / Request a Free Quote | ${brand}`, description: 'Request plumbing service or a project quotation in Delhi, Gurugram, Noida, Faridabad and Greater Noida.' },
    '/emergency': { title: `Emergency Plumbing Help in Delhi NCR | ${brand}`, description: 'Burst pipe, major leak or sewer overflow? Call, WhatsApp or request immediate assistance.' },
    '/contact': { title: `Contact Us | ${brand}`, description: 'Contact our plumbing and engineering team for projects and service across Delhi NCR.' },
  };
  if (fixed[p]) return fixed[p];
  let m;
  if ((m = p.match(/^\/services\/([a-z0-9-]+)$/))) {
    const s = await one('SELECT title, summary FROM services WHERE slug = $1 AND published', [m[1]]);
    if (s) return { title: `${s.title} in Delhi NCR | ${brand}`, description: s.summary };
  }
  if ((m = p.match(/^\/projects\/([a-z0-9-]+)$/))) {
    const s = await one('SELECT title, location, description FROM projects WHERE slug = $1 AND published', [m[1]]);
    if (s) return { title: `${s.title}${s.location ? `, ${s.location}` : ''} | ${brand}`, description: s.description.slice(0, 155) };
  }
  if ((m = p.match(/^\/plumbing-contractor\/([a-z0-9-]+)$/))) {
    const a = AREA_PAGES.find((x) => x.slug === m[1]);
    if (a) return { title: `${a.metaTitle} | ${brand}`, description: a.metaDescription };
  }
  return base;
}

export function spaHandler() {
  const indexPath = path.join(config.clientDist, 'index.html');
  let template = null;
  return async (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/media/')) return next();
    try {
      // Cache the template in production only, so rebuilding the client during development is picked up.
      if (!template || !config.isProd) template = fs.readFileSync(indexPath, 'utf8');
      const business = await getBusiness();
      const meta = await metaFor(req.path, business);
      const canonical = `${config.siteUrl}${req.path === '/' ? '' : req.path.replace(/\/+$/, '')}`;
      const isAdmin = req.path.startsWith('/admin');
      const head = [
        `<title>${esc(meta.title)}</title>`,
        `<meta data-rh="true" name="description" content="${esc(meta.description)}" />`,
        `<link data-rh="true" rel="canonical" href="${esc(canonical)}" />`,
        `<meta data-rh="true" property="og:title" content="${esc(meta.title)}" />`,
        `<meta data-rh="true" property="og:description" content="${esc(meta.description)}" />`,
        `<meta data-rh="true" property="og:url" content="${esc(canonical)}" />`,
        isAdmin ? `<meta data-rh="true" name="robots" content="noindex, nofollow" />` : '',
      ].join('\n    ');
      const html = template.replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, head);
      res.set('Cache-Control', 'no-cache').type('html').send(html);
    } catch (err) {
      next(err);
    }
  };
}

export default router;
