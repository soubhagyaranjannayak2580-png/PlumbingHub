import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { config } from '../config.js';
import { HttpError } from './http.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const imageUpload = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { files: maxFiles, fileSize: 8 * 1024 * 1024, fields: 40, fieldSize: 64 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED.has(file.mimetype)) cb(null, true);
      else cb(new HttpError(400, 'Only JPG, PNG or WebP images are allowed.'));
    },
  });

/**
 * Decodes, auto-rotates, strips metadata (incl. GPS EXIF), resizes and re-encodes as WebP.
 * Decoding also verifies the file really is an image regardless of its declared MIME type.
 */
export async function optimiseImage(buffer, maxSize = 1600, quality = 80) {
  try {
    return await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch {
    throw new HttpError(400, 'One of the images could not be read. Please upload a valid JPG, PNG or WebP photo.');
  }
}

export const privateDir = () => path.join(config.uploadsDir, 'private');
export const publicDir = () => path.join(config.uploadsDir, 'public');

export async function writeFileSafe(dir, name, buffer) {
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await fs.writeFile(full, buffer);
  return full;
}

export const randomName = () => crypto.randomBytes(12).toString('hex');

/** Stores an admin-uploaded public image in two responsive sizes and returns their URLs. */
export async function storePublicImage(buffer, folder) {
  const id = randomName();
  const dir = path.join(publicDir(), folder);
  const [large, small] = await Promise.all([optimiseImage(buffer, 1800, 80), optimiseImage(buffer, 800, 75)]);
  await writeFileSafe(dir, `${id}-1800.webp`, large);
  await writeFileSafe(dir, `${id}-800.webp`, small);
  return { src: `/media/${folder}/${id}-1800.webp`, thumb: `/media/${folder}/${id}-800.webp` };
}
