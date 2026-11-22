import { Router } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import rateLimit from 'express-rate-limit';
import { query, one } from '../db.js';
import { ah, parse, HttpError } from '../lib/http.js';
import { enquirySchema, todayInIndia } from '../lib/schemas.js';
import { imageUpload, optimiseImage, privateDir, randomName, writeFileSafe } from '../lib/images.js';
import { getBusiness } from '../lib/settings.js';
import { sendCustomerAcknowledgement, sendEnquiryNotification } from '../lib/mailer.js';
import { config } from '../config.js';

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions from this network. Please call or WhatsApp us instead.' },
});

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeReference(kind) {
  const prefix = kind === 'emergency' ? 'XYZ-EM' : kind === 'contact' ? 'XYZ-CT' : 'XYZ';
  const date = todayInIndia().slice(2).replace(/-/g, '');
  let rand = '';
  for (let i = 0; i < 5; i++) rand += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return `${prefix}-${date}-${rand}`;
}

router.post(
  '/',
  submitLimiter,
  imageUpload(5).array('images', 5),
  ah(async (req, res) => {
    const data = parse(enquirySchema, req.body);

    // Reject obvious bots (hidden honeypot field filled) without storing anything.
    if (data.website) throw new HttpError(400, 'Submission rejected.');

    // Validate & optimise every image before writing anything.
    const files = req.files ?? [];
    const processed = [];
    for (const f of files) processed.push({ original: f.originalname?.slice(0, 200) ?? null, buffer: await optimiseImage(f.buffer) });

    const urgency = data.kind === 'emergency' ? 'emergency' : data.urgency;
    const service = data.service || (data.kind === 'emergency' ? 'Emergency assistance' : data.kind === 'contact' ? 'General enquiry' : null);

    let row = null;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      try {
        row = await one(
          `INSERT INTO enquiries (reference, kind, full_name, mobile, email, location, address, property_type, service,
             description, preferred_date, preferred_time, urgency)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [
            makeReference(data.kind),
            data.kind,
            data.fullName,
            data.mobile,
            data.email ?? null,
            data.location ?? null,
            data.address ?? null,
            data.propertyType ?? null,
            service,
            data.description,
            data.preferredDate ?? null,
            data.preferredTime ?? null,
            urgency,
          ],
        );
      } catch (err) {
        if (err?.code !== '23505') throw err; // retry only on reference collision
      }
    }
    if (!row) throw new Error('Could not allocate a unique reference number');

    const written = [];
    try {
      const dir = path.join(privateDir(), 'enquiries', row.reference);
      for (const p of processed) {
        const name = `${randomName()}.webp`;
        written.push(await writeFileSafe(dir, name, p.buffer));
        await query('INSERT INTO enquiry_images (enquiry_id, filename, original_name, size) VALUES ($1,$2,$3,$4)', [
          row.id,
          name,
          p.original,
          p.buffer.length,
        ]);
      }
    } catch (err) {
      // Roll back so the customer is never told it succeeded when it did not.
      await query('DELETE FROM enquiries WHERE id = $1', [row.id]);
      await Promise.all(written.map((f) => fs.rm(f, { force: true })));
      throw err;
    }

    await query(
      `INSERT INTO enquiry_notes (enquiry_id, kind, body) VALUES ($1, 'event', $2)`,
      [row.id, `Enquiry received via website (${row.kind}, ${row.urgency}).`],
    );

    // Email notifications are sent in the background; the dashboard records whether delivery succeeded.
    getBusiness()
      .then(async (business) => {
        const ok = await sendEnquiryNotification(row, business, processed.length);
        if (ok) await query('UPDATE enquiries SET email_notified = TRUE WHERE id = $1', [row.id]);
        await sendCustomerAcknowledgement(row, business);
      })
      .catch((err) => console.error('[enquiries] notification error', err));

    res.status(201).json({
      reference: row.reference,
      kind: row.kind,
      urgency: row.urgency,
      createdAt: row.created_at,
    });
  }),
);

export default router;
