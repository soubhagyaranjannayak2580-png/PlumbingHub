import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { telHref, useSite, whatsappHref } from '../lib/site';
import type { EnquiryKind, Urgency } from '../lib/types';
import { AlertIcon, CheckIcon, CloseIcon, PhoneIcon, UploadIcon, WhatsAppIcon } from '../components/ui/Icons';

interface Props {
  variant?: EnquiryKind;
  tone?: 'dark' | 'light';
  defaultService?: string;
  defaultLocation?: string;
}

type Values = {
  fullName: string;
  mobile: string;
  email: string;
  location: string;
  address: string;
  propertyType: string;
  service: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  urgency: Urgency;
  website: string;
};

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MOBILE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const URGENCY: { v: Urgency; label: string; hint: string }[] = [
  { v: 'emergency', label: 'Emergency', hint: 'Active leak, burst pipe, overflow' },
  { v: 'urgent', label: 'Urgent', hint: 'Needs attention within 1–2 days' },
  { v: 'normal', label: 'Normal', hint: 'Planned work or quotation' },
];

const FieldCtx = createContext<{ uid: string; errors: Record<string, string>; labelCls: string; muted: string }>({
  uid: '',
  errors: {},
  labelCls: '',
  muted: '',
});

function Field({ name, label, required, children, hint }: { name: string; label: string; required?: boolean; children: ReactNode; hint?: string }) {
  const { uid, errors, labelCls, muted } = useContext(FieldCtx);
  return (
    <div>
      <label htmlFor={`${uid}-${name}`} className={labelCls}>
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {hint && !errors[name] && <p className={`mt-1 text-xs ${muted}`}>{hint}</p>}
      {errors[name] && (
        <p id={`${uid}-${name}-err`} className="field-error" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );
}

function validate(v: Values, variant: EnquiryKind, files: File[]) {
  const e: Partial<Record<keyof Values | 'images', string>> = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (!MOBILE_RE.test(v.mobile.replace(/[\s\-()]/g, ''))) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (variant !== 'contact' && !v.location) e.location = 'Select your location.';
  if (variant === 'booking') {
    if (!v.propertyType) e.propertyType = 'Select a property type.';
    if (!v.service) e.service = 'Select the required service.';
    if (v.preferredDate && v.preferredDate < todayLocal()) e.preferredDate = 'Date cannot be in the past.';
  }
  if (v.description.trim().length < 10) e.description = 'Please describe the issue in at least 10 characters.';
  if (files.length > MAX_FILES) e.images = `You can upload up to ${MAX_FILES} images.`;
  return e;
}

export default function EnquiryForm({ variant = 'booking', tone = 'dark', defaultService = '', defaultLocation = '' }: Props) {
  const { data } = useSite();
  const business = data?.business;
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>({
    fullName: '',
    mobile: '',
    email: '',
    location: defaultLocation,
    address: '',
    propertyType: '',
    service: defaultService,
    description: '',
    preferredDate: '',
    preferredTime: '',
    urgency: variant === 'emergency' ? 'emergency' : 'normal',
    website: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultService) setValues((v) => ({ ...v, service: defaultService }));
  }, [defaultService]);

  const previews = useMemo(() => files.map((f) => ({ f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const locations = [...(business?.serviceAreas ?? ['Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Greater Noida']), 'Other (Delhi NCR)'];
  const services = [...(data?.services ?? []).map((s) => s.title), 'Other / Not sure'];
  const propertyTypes = data?.options.propertyTypes ?? [];
  const timeSlots = data?.options.timeSlots ?? [];

  const set = (k: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors(({ [k]: _drop, ...rest }) => rest);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !ACCEPT.includes(f.type));
    const big = incoming.find((f) => f.size > MAX_BYTES);
    const next = [...files, ...incoming.filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES)].slice(0, MAX_FILES);
    setFiles(next);
    setErrors((e) => {
      const { images: _i, ...rest } = e;
      if (bad) return { ...rest, images: 'Only JPG, PNG or WebP images are allowed.' };
      if (big) return { ...rest, images: 'Each image must be 8 MB or smaller.' };
      if (files.length + incoming.length > MAX_FILES) return { ...rest, images: `Only the first ${MAX_FILES} images were added.` };
      return rest;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(values, variant, files);
    setErrors(errs as Record<string, string>);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const fd = new FormData();
    fd.append('kind', variant);
    (Object.keys(values) as (keyof Values)[]).forEach((k) => {
      if (values[k]) fd.append(k, values[k]);
    });
    files.forEach((f) => fd.append('images', f, f.name));
    setStatus('submitting');
    try {
      const res = await api<{ reference: string }>('/api/enquiries', { method: 'POST', body: fd });
      setResult(res);
      setStatus('success');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      const ae = err as ApiError;
      setStatus('error');
      setServerError(ae.message || 'Submission failed.');
      if (ae.fields) setErrors(ae.fields);
    }
  };

  const reset = () => {
    setValues((v) => ({ ...v, description: '', preferredDate: '', preferredTime: '', address: '' }));
    setFiles([]);
    setResult(null);
    setStatus('idle');
  };

  const dark = tone === 'dark';
  const fieldCls = dark ? 'field-dark' : 'field-light';
  const labelCls = `field-label ${dark ? 'text-white/85' : 'text-navy'}`;
  const muted = dark ? 'text-white/55' : 'text-slate-500';

  const ctx = { uid, errors, labelCls, muted };
  const a11y = (name: string) => ({
    id: `${uid}-${name}`,
    name,
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `${uid}-${name}-err` : undefined,
  });

  if (status === 'success' && result) {
    const msg = `Hello, I just submitted a plumbing request on your website. My reference number is ${result.reference}.`;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-8 text-center sm:p-10 ${dark ? 'glass' : 'card-light'}`}
        role="status"
        aria-live="polite"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white"
        >
          <CheckIcon size={32} />
        </motion.div>
        <h3 className="mt-5 text-2xl font-bold">Request received</h3>
        <p className={`mt-2 ${muted}`}>Your enquiry has been recorded. Please keep your reference number for follow-up.</p>
        <div className={`mx-auto mt-6 inline-flex items-center gap-3 rounded-2xl px-5 py-3 font-mono text-xl font-bold tracking-wider ${dark ? 'bg-white/10' : 'bg-mist'}`}>
          {result.reference}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(result.reference).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
            className="rounded-lg bg-electric px-2.5 py-1 font-sans text-xs font-semibold text-white"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className={`mt-4 text-sm ${muted}`}>Our team will contact you on the mobile number you provided.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {business?.whatsapp && (
            <a href={whatsappHref(business.whatsapp, msg)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:brightness-110">
              <WhatsAppIcon size={18} /> Continue on WhatsApp
            </a>
          )}
          {business?.phone && (
            <a href={telHref(business.phone)} className={dark ? 'btn-ghost' : 'btn-dark'}>
              <PhoneIcon size={18} /> Call {business.phone}
            </a>
          )}
          <button type="button" onClick={reset} className={dark ? 'btn-ghost' : 'btn border border-slate-300 text-navy hover:bg-mist'}>
            Submit another request
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <FieldCtx.Provider value={ctx}>
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby={serverError ? `${uid}-server` : undefined}>
      {/* Honeypot: hidden from humans and assistive tech */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={set('website')} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="fullName" label="Full name" required>
          <input {...a11y('fullName')} className={fieldCls} autoComplete="name" value={values.fullName} onChange={set('fullName')} maxLength={100} />
        </Field>
        <Field name="mobile" label="Mobile number" required>
          <input {...a11y('mobile')} className={fieldCls} type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" value={values.mobile} onChange={set('mobile')} maxLength={16} />
        </Field>
        {variant !== 'emergency' && (
          <Field name="email" label="Email address">
            <input {...a11y('email')} className={fieldCls} type="email" autoComplete="email" value={values.email} onChange={set('email')} maxLength={160} />
          </Field>
        )}
        {variant !== 'contact' && (
          <Field name="location" label={variant === 'emergency' ? 'Your location' : 'Service location'} required>
            <select {...a11y('location')} className={fieldCls} value={values.location} onChange={set('location')}>
              <option value="">Select city</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        )}
        {variant === 'booking' && (
          <>
            <Field name="propertyType" label="Property type" required>
              <select {...a11y('propertyType')} className={fieldCls} value={values.propertyType} onChange={set('propertyType')}>
                <option value="">Select property type</option>
                {propertyTypes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="service" label="Required service" required>
              <select {...a11y('service')} className={fieldCls} value={values.service} onChange={set('service')}>
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {variant !== 'contact' && (
          <div className={variant === 'emergency' ? 'sm:col-span-2' : ''}>
            <Field name="address" label="Address / landmark" hint="Helps our team reach you faster.">
              <input {...a11y('address')} className={fieldCls} autoComplete="street-address" value={values.address} onChange={set('address')} maxLength={300} />
            </Field>
          </div>
        )}
      </div>

      <Field name="description" label={variant === 'contact' ? 'Your message' : 'Describe the issue or requirement'} required>
        <textarea
          {...a11y('description')}
          className={`${fieldCls} min-h-[120px] resize-y`}
          value={values.description}
          onChange={set('description')}
          maxLength={3000}
          placeholder={variant === 'emergency' ? 'e.g. Main pipe burst in the basement, water spreading…' : 'e.g. Complete bathroom plumbing for a new 3BHK flat…'}
        />
      </Field>

      {variant === 'booking' && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="preferredDate" label="Preferred appointment date">
              <input {...a11y('preferredDate')} className={fieldCls} type="date" min={todayLocal()} value={values.preferredDate} onChange={set('preferredDate')} />
            </Field>
            <Field name="preferredTime" label="Preferred time">
              <select {...a11y('preferredTime')} className={fieldCls} value={values.preferredTime} onChange={set('preferredTime')}>
                <option value="">Select time slot</option>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className={labelCls}>
              Service urgency <span className="text-accent">*</span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {URGENCY.map((u) => {
                const on = values.urgency === u.v;
                const ring = u.v === 'emergency' ? 'border-red-500 bg-red-500/10' : u.v === 'urgent' ? 'border-accent bg-accent/10' : 'border-electric bg-electric/10';
                return (
                  <label
                    key={u.v}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${on ? ring : dark ? 'border-white/15 hover:border-white/35' : 'border-slate-300 hover:border-slate-400'}`}
                  >
                    <input type="radio" name="urgency" value={u.v} checked={on} onChange={set('urgency')} className="sr-only" />
                    <span className="flex items-center gap-2 font-display text-sm font-semibold">
                      <span className={`h-2.5 w-2.5 rounded-full ${u.v === 'emergency' ? 'bg-red-500' : u.v === 'urgent' ? 'bg-accent' : 'bg-electric'}`} />
                      {u.label}
                    </span>
                    <span className={`mt-1 block text-xs ${muted}`}>{u.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      {variant !== 'contact' && (
        <div>
          <span className={labelCls}>Photos of the issue (optional)</span>
          <label
            htmlFor={`${uid}-images`}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
              dark ? 'border-white/15 text-white/60 hover:border-electric hover:text-white' : 'border-slate-300 text-slate-500 hover:border-electric'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <UploadIcon size={24} className="text-electric" />
            <span>
              <strong className={dark ? 'text-white' : 'text-navy'}>Click to upload</strong> or drag & drop
            </span>
            <span className="text-xs">JPG, PNG or WebP · up to {MAX_FILES} images · max 8 MB each</span>
          </label>
          <input
            id={`${uid}-images`}
            name="images"
            type="file"
            accept={ACCEPT.join(',')}
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          {errors.images && <p className="field-error" role="alert">{errors.images}</p>}
          {previews.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <li key={p.url} className="relative">
                  <img src={p.url} alt={`Upload ${i + 1}`} className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/15" />
                  <button
                    type="button"
                    onClick={() => setFiles((fs) => fs.filter((_, k) => k !== i))}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AnimatePresence>
        {status === 'error' && serverError && (
          <motion.div
            id={`${uid}-server`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm"
            role="alert"
          >
            <AlertIcon size={20} className="shrink-0 text-red-400" />
            <div>
              <p className={dark ? 'text-red-200' : 'text-red-700'}>{serverError}</p>
              <p className={`mt-1 ${muted}`}>
                Your request was <strong>not</strong> submitted.
                {business?.phone && (
                  <>
                    {' '}You can also call us at{' '}
                    <a className="text-electric underline" href={telHref(business.phone)}>
                      {business.phone}
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${muted}`}>
          <span className="text-accent">*</span> Required. Your details are used only to respond to this enquiry.
        </p>
        <button type="submit" disabled={status === 'submitting'} className={variant === 'emergency' ? 'btn-accent !px-8 !py-3.5' : 'btn-primary !px-8 !py-3.5'}>
          {status === 'submitting' ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> Submitting…
            </>
          ) : variant === 'emergency' ? (
            'Request Immediate Assistance'
          ) : variant === 'contact' ? (
            'Send Message'
          ) : (
            'Submit Service Request'
          )}
        </button>
      </div>
    </form>
    </FieldCtx.Provider>
  );
}
