import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { one, query } from '../db.js';
import { ah, parse, HttpError } from '../lib/http.js';
import { loginSchema } from '../lib/schemas.js';
import { clearSession, issueSession, requireAuth, requireCsrfHeader } from '../lib/auth.js';
import { config } from '../config.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

// Used to keep response timing similar when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-placeholder', 12);

router.use(requireCsrfHeader);

router.post(
  '/login',
  loginLimiter,
  ah(async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const user = await one('SELECT * FROM users WHERE email = $1', [email]);
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok || !user.active) throw new HttpError(401, 'Invalid email or password.');
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    issueSession(res, user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }),
);

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ user: { id, name, email, role } });
});

export default router;
