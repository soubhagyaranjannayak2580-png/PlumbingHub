import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { one } from '../db.js';
import { HttpError } from './http.js';

export const SESSION_COOKIE = 'xyz_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function issueSession(res, user) {
  const token = jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    expiresIn: SESSION_TTL_SECONDS,
    issuer: 'xyz-plumbing',
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProd,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/api',
  });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'strict', secure: config.isProd, path: '/api' });
}

/** Authenticates the request from the httpOnly session cookie and re-checks the user in the database. */
export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in.');
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { issuer: 'xyz-plumbing' });
    } catch {
      throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }
    const user = await one('SELECT id, name, email, role, active FROM users WHERE id = $1', [Number(payload.sub)]);
    if (!user || !user.active) throw new HttpError(401, 'Account is not active.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Please sign in.'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do that.'));
    next();
  };

/**
 * CSRF defence for cookie-authenticated, state-changing requests: browsers cannot attach this custom
 * header cross-origin without a CORS preflight (which this API never approves). Combined with SameSite=Strict.
 */
export function requireCsrfHeader(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'XMLHttpRequest') return next(new HttpError(403, 'Missing request header.'));
  next();
}
