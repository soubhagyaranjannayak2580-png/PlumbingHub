import { z } from 'zod';
import { PROJECT_CATEGORIES, PROPERTY_TYPES, SERVICE_ICONS, TIME_SLOTS } from '../content/defaults.js';

/** Treat empty strings from forms as "not provided". */
const blank = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optStr = (max) => z.preprocess(blank, z.string().trim().max(max).optional());

export const todayInIndia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );

export const normaliseMobile = (v) => String(v ?? '').replace(/[\s\-()]/g, '');
const MOBILE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

export const enquirySchema = z
  .object({
    kind: z.enum(['booking', 'emergency', 'contact']).default('booking'),
    fullName: z.string({ required_error: 'Please enter your full name.' }).trim().min(2, 'Please enter your full name.').max(100),
    mobile: z
      .string({ required_error: 'Please enter your mobile number.' })
      .transform(normaliseMobile)
      .refine((v) => MOBILE_RE.test(v), 'Enter a valid 10-digit Indian mobile number.'),
    email: z.preprocess(blank, z.string().trim().toLowerCase().email('Enter a valid email address.').max(160).optional()),
    location: optStr(80),
    address: optStr(300),
    propertyType: z.preprocess(blank, z.enum(PROPERTY_TYPES, { message: 'Select a property type.' }).optional()),
    service: optStr(120),
    description: z
      .string({ required_error: 'Please describe the issue or requirement.' })
      .trim()
      .min(10, 'Please describe the issue in at least 10 characters.')
      .max(3000),
    preferredDate: z.preprocess(blank, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date.').optional()),
    preferredTime: z.preprocess(blank, z.enum(TIME_SLOTS, { message: 'Select a time slot.' }).optional()),
    urgency: z.enum(['emergency', 'urgent', 'normal'], { message: 'Select how urgent this is.' }).default('normal'),
    website: z.string().optional(), // honeypot – must stay empty
  })
  .superRefine((d, ctx) => {
    const need = (field, message) => {
      if (!d[field]) ctx.addIssue({ code: 'custom', path: [field], message });
    };
    if (d.kind === 'booking') {
      need('location', 'Select your service location.');
      need('propertyType', 'Select a property type.');
      need('service', 'Select the required service.');
    }
    if (d.kind === 'emergency') need('location', 'Select your location.');
    if (d.preferredDate) {
      const today = todayInIndia();
      if (d.preferredDate < today) ctx.addIssue({ code: 'custom', path: ['preferredDate'], message: 'Date cannot be in the past.' });
      const max = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
      if (d.preferredDate > max) ctx.addIssue({ code: 'custom', path: ['preferredDate'], message: 'Choose a date within the next 4 months.' });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

const strongPassword = z.string().min(10, 'Password must be at least 10 characters.').max(200);

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: strongPassword,
  role: z.enum(['admin', 'staff']),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(['admin', 'staff']).optional(),
  active: z.boolean().optional(),
  password: strongPassword.optional(),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'completed', 'cancelled']).optional(),
  technicianId: z.number().int().positive().nullable().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  scheduledTime: z.string().trim().max(60).nullable().optional(),
});

export const noteSchema = z.object({ body: z.string().trim().min(1, 'Note cannot be empty.').max(2000) });

export const technicianSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional().default(''),
  specialization: z.string().trim().max(120).optional().default(''),
  active: z.boolean().optional().default(true),
});

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.');

export const serviceSchema = z.object({
  slug,
  title: z.string().trim().min(2).max(100),
  summary: z.string().trim().max(300).default(''),
  description: z.string().trim().max(4000).default(''),
  features: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  icon: z.enum(SERVICE_ICONS),
  sort: z.number().int().default(0),
  published: z.boolean().default(true),
});

const imageRef = z.object({
  src: z.string().regex(/^\/media\/[\w\-/.]+$/),
  thumb: z.string().regex(/^\/media\/[\w\-/.]+$/).optional(),
  alt: z.string().trim().max(200).default(''),
});

export const projectSchema = z.object({
  slug,
  title: z.string().trim().min(2).max(140),
  location: z.string().trim().max(120).default(''),
  category: z.enum(PROJECT_CATEGORIES),
  description: z.string().trim().max(6000).default(''),
  scope: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  images: z.array(imageRef).max(30).default([]),
  beforeImage: imageRef.nullable().default(null),
  afterImage: imageRef.nullable().default(null),
  completedOn: z.string().trim().max(40).default(''),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sort: z.number().int().default(0),
});

export const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(100),
  projectType: z.string().trim().max(100).default(''),
  location: z.string().trim().max(100).default(''),
  feedback: z.string().trim().min(5).max(2000),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  ratingVerified: z.boolean().default(false),
  published: z.boolean().default(false),
  sort: z.number().int().default(0),
});

const s = (max) => z.string().trim().max(max).default('');
export const businessSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  legalName: s(140),
  tagline: s(200),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^$|^\+?[0-9 \-]{8,20}$/, 'Enter a valid phone number (digits, spaces, + or -).')
    .default(''),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .regex(/^$|^\+?[0-9 \-]{8,20}$/, 'Enter a valid WhatsApp number including country code.')
    .default(''),
  email: z.union([z.literal(''), z.string().trim().email()]).default(''),
  address: z.object({ line1: s(160), line2: s(160), city: s(80), state: s(80), postalCode: s(12) }),
  mapEmbedQuery: s(300),
  workingHours: s(160),
  emergency: z.object({ available24x7: z.boolean().default(false), note: s(300) }),
  serviceAreas: z.array(z.string().trim().min(1).max(60)).max(30),
  stats: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(40),
        label: z.string().trim().min(1).max(60),
        value: z.number().int().min(0).max(10_000_000).nullable(),
        suffix: s(4),
      }),
    )
    .max(8),
  social: z.object({ facebook: s(300), instagram: s(300), linkedin: s(300), youtube: s(300) }),
  notificationEmail: z.union([z.literal(''), z.string().trim().email()]).default(''),
});
