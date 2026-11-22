import { Router } from 'express';
import { query, one } from '../db.js';
import { ah, HttpError } from '../lib/http.js';
import { getBusiness, publicBusiness } from '../lib/settings.js';
import { mapProject, mapService, mapTestimonial } from '../lib/mappers.js';
import { PROJECT_CATEGORIES, PROPERTY_TYPES, TIME_SLOTS } from '../content/defaults.js';

const router = Router();

router.get(
  '/site',
  ah(async (_req, res) => {
    const [business, services, testimonials, projects] = await Promise.all([
      getBusiness(),
      query('SELECT * FROM services WHERE published ORDER BY sort, id'),
      query('SELECT * FROM testimonials WHERE published ORDER BY sort, created_at DESC'),
      query('SELECT * FROM projects WHERE published ORDER BY featured DESC, sort, created_at DESC'),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      business: publicBusiness(business),
      services: services.rows.map(mapService),
      testimonials: testimonials.rows.map((r) => mapTestimonial(r)),
      projects: projects.rows.map(mapProject),
      options: { propertyTypes: PROPERTY_TYPES, timeSlots: TIME_SLOTS, projectCategories: PROJECT_CATEGORIES },
    });
  }),
);

router.get(
  '/projects/:slug',
  ah(async (req, res) => {
    const row = await one('SELECT * FROM projects WHERE slug = $1 AND published', [req.params.slug]);
    if (!row) throw new HttpError(404, 'Project not found.');
    res.json(mapProject(row));
  }),
);

export default router;
