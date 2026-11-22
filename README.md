# XYZ Plumbing & Engineering – Website & Enquiry Management

A premium, 3D-interactive website for a plumbing and engineering contractor serving Delhi NCR. It includes a working service-request system and a secure admin dashboard.

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP + ScrollTrigger, Three.js, React Three Fiber, Drei |
| Backend | Node.js (≥ 20), Express, Zod validation, Helmet, rate limiting |
| Database | PostgreSQL, either Supabase / any Postgres via `DATABASE_URL`, or an embedded Postgres (PGlite) for zero-setup local use |
| Integrations | WhatsApp (`wa.me` links), email via SMTP (Nodemailer), Google Maps embed, image uploads (optimised with `sharp`) |

## Quick start

```bash
npm install
cp .env.example .env      # then edit: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev               # API on :4000, site on http://localhost:5173
```

The first admin account is created automatically from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on first start. Without them, run `npm run create-admin -- you@company.com "a-strong-password" "Your Name"`.

Then sign in at **/admin/login**, open **Business Info**, and enter the verified phone, WhatsApp, email, address, working hours and statistics. Until you do, call/WhatsApp buttons, the map and statistics stay hidden or show "—". No fake data is ever displayed.

### Production

```bash
npm run build             # builds client/dist
NODE_ENV=production npm start   # Express serves the API + built site on PORT
```

In production `JWT_SECRET` (≥ 32 chars) is mandatory, cookies are `Secure`, and set `SITE_URL` to the public domain (used for the sitemap, canonical URLs and email links). Behind a reverse proxy, set `TRUST_PROXY=1`.

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. **Supabase:** Project Settings → Database → Connection string (URI), and also set `DATABASE_SSL=require`. Leave empty for the embedded DB in `./data`. |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | Email notifications (e.g. Gmail app password, Brevo/SendGrid free tiers). |
| `NOTIFY_EMAIL` | Fallback recipient for new-enquiry alerts (the admin "Enquiry notification email" setting takes priority). |
| `UPLOADS_DIR` / `DATA_DIR` | Storage locations (default `./uploads`, `./data/pglite`). |

Tables are created automatically on startup. The schema is in [server/src/db.js](server/src/db.js).

## Features

- **Cinematic hero**: a procedural glass pipe network with shader-driven flowing water, travelling particles, metal couplings, flanges, a valve and gauge, floating components, and a camera driven by scroll (GSAP ScrollTrigger) and the pointer.
- **"Understanding the System"**: an interactive two-storey building plumbing model. Rotate, zoom and pan it, and switch between Overview, Water Supply, Hot & Cold, Drainage, Bathroom, Kitchen, Overhead Tank and Underground views. Click any of 24 components for its name, description, purpose and technical information.
- **Services**: 8 seeded services with custom animated icons and tilt/glow hover effects. Each has its own page with Service structured data and a pre-filled request form. Services are editable in the admin.
- **Service requests**: client- and server-side validation, urgency (Emergency/Urgent/Normal), preferred date and time, and up to 5 photos (re-encoded to WebP, EXIF/GPS stripped). Each request gets a unique reference (`XYZ-YYMMDD-XXXXX`) and is stored in the database, triggers an email notification and offers a WhatsApp follow-up. Success is shown **only** after the server confirms the record is stored.
- **Emergency section/page**: call and WhatsApp buttons (shown only when numbers are configured), an immediate-assistance form flagged as an emergency, and safety tips. 24/7 is claimed only if enabled in admin.
- **Portfolio**: category filters, galleries with a lightbox, a before/after slider and project detail pages. It starts empty until real projects are added.
- **Why Choose Us**: animated counters for verified figures; unverified figures show "—".
- **How We Work**: the 7-step workflow with scroll-drawn connecting lines and interactive steps.
- **Testimonials**: admin-managed. Star ratings show only when marked as verified.
- **Contact**: business details, Google Maps embed, coverage map and contact form.
- **Admin dashboard** (`/admin`):
  - Overview KPIs and a 14-day trend.
  - Search and filters (status, urgency, type, service, location, technician, date range) plus CSV export.
  - Status updates, technician assignment, appointment scheduling, internal notes and an automatic activity log.
  - Private customer photos.
  - Management of services, projects (with image upload), testimonials, business info, technicians and users.
- **Roles**: `admin` has full access. `staff` can only view and update enquiries and view technicians. This is enforced on the server.

## Security

- bcrypt password hashes and an 8-hour JWT in an `httpOnly`, `SameSite=Strict` cookie. The user is re-checked in the database on every request, so disabling a user takes effect immediately.
- A CSRF header check on state-changing requests, rate limits on login and enquiry submission, and a honeypot field against bots.
- Helmet with a strict CSP; admin responses are `no-store`; formula injection is neutralised in CSV exports.
- Customer photos are stored outside the public folder and streamed only to signed-in staff.

## SEO

- Route-specific titles, descriptions, canonical and Open Graph tags. In production they are injected server-side into the HTML before JavaScript runs.
- `Plumber` (LocalBusiness) JSON-LD built only from verified settings.
- A dynamic `/sitemap.xml` and `/robots.txt` (admin disallowed).
- Local area pages for Delhi, Gurugram, Noida, Faridabad and Greater Noida at `/plumbing-contractor/<city>`, plus semantic HTML with one `h1` per page.

## Performance & accessibility

- 3D code is lazy-loaded (not part of the initial bundle) and mounts only near the viewport. Render loops pause when off-screen.
- Device detection picks the full scene, a lighter scene, or a static SVG fallback. Force a level with `?quality=off|low|high`.
- `prefers-reduced-motion` turns off flowing/scroll animation and counters.
- Responsive images (800/1800 px WebP), accessible forms (labels, `aria-invalid`, focus on the first error), a skip link, and a non-3D component list as an alternative to the model.

## Testing

```bash
npm test                  # API tests: validation, storage, uploads, auth, CSRF, roles, sitemap
npm run typecheck         # TypeScript
```

## Project structure

```
client/src
  admin/          admin app (auth, pages)
  components/     layout + UI primitives
  content/        local area page content
  forms/          EnquiryForm (booking / emergency / contact)
  pages/          public routes
  sections/       homepage sections
  three/          3D: pipe geometry & water shader, hero scene, building system scene + data
server/src
  routes/         public, enquiries, auth, admin, seo
  lib/            auth, validation schemas, images, mailer, settings
  content/        seeded services & defaults
```

## Before going live

1. Fill in **Business Info** with verified details (phone, WhatsApp, address, hours, statistics).
2. Configure SMTP so enquiry emails are delivered. The dashboard warns while it is missing.
3. Use a managed Postgres (e.g. Supabase free tier) and persistent storage for `uploads/`, or swap in object storage.
4. Add real projects and genuine testimonials.
5. Replace `client/public/og-image.svg` with a branded 1200×630 PNG/JPG (some social platforms don't render SVG previews).
