import { ZodError } from 'zod';
import multer from 'multer';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap async route handlers so rejected promises reach the error handler. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function zodDetails(err) {
  const fields = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, 'Please correct the highlighted fields.', zodDetails(result.error));
  return result.data;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: zodDetails(err) });
  }
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Each image must be 8 MB or smaller.',
      LIMIT_FILE_COUNT: 'You can upload up to 5 images.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field or too many images.',
    };
    return res.status(400).json({ error: messages[err.code] || 'Upload failed.' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { fields: err.details } : {}) });
  }
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  // Client errors raised by middleware (e.g. express.static 404s, malformed JSON 400s).
  const status = err?.status ?? err?.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 404 ? 'Not found.' : 'Bad request.' });
  }
  if (err?.code === '23505') return res.status(409).json({ error: 'A record with that unique value already exists.' });
  console.error('[error]', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
