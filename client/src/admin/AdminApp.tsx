import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './auth';
import Logo from '../components/layout/Logo';
import PageLoader from '../components/ui/PageLoader';
import { Alert, btnPrimary, inputCls, labelCls } from './ui';
import { MenuIcon, CloseIcon } from '../components/ui/Icons';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const EnquiryDetail = lazy(() => import('./pages/EnquiryDetail'));
const Technicians = lazy(() => import('./pages/Technicians'));
const ServicesAdmin = lazy(() => import('./pages/ServicesAdmin'));
const ProjectsAdmin = lazy(() => import('./pages/ProjectsAdmin'));
const TestimonialsAdmin = lazy(() => import('./pages/TestimonialsAdmin'));
const SettingsAdmin = lazy(() => import('./pages/SettingsAdmin'));
const UsersAdmin = lazy(() => import('./pages/UsersAdmin'));

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center text-white">
          <Logo />
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="font-display text-xl font-bold text-navy">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Authorised staff only.</p>
          <div className="mt-6 space-y-4">
            {error && <Alert>{error}</Alert>}
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input id="email" type="email" autoComplete="username" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>
                Password
              </label>
              <input id="password" type="password" autoComplete="current-password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full !py-2.5`}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const NAV: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/enquiries', label: 'Enquiries' },
  { to: '/admin/technicians', label: 'Technicians' },
  { to: '/admin/services', label: 'Services', adminOnly: true },
  { to: '/admin/projects', label: 'Projects', adminOnly: true },
  { to: '/admin/testimonials', label: 'Testimonials', adminOnly: true },
  { to: '/admin/settings', label: 'Business Info', adminOnly: true },
  { to: '/admin/users', label: 'Users & Access', adminOnly: true },
];

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = NAV.filter((n) => !n.adminOnly || user?.role === 'admin');
  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin">
      <div className="mb-6 px-2 text-white">
        <Logo compact />
      </div>
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/admin'}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-electric text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          {n.label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="px-3 text-sm font-medium text-white">{user?.name}</p>
        <p className="px-3 text-xs capitalize text-white/50">{user?.role}</p>
        <div className="mt-3 flex gap-2 px-3">
          <a href="/" className="text-xs text-white/60 hover:text-white">
            View site
          </a>
          <span className="text-white/30">·</span>
          <button type="button" onClick={logout} className="text-xs text-white/60 hover:text-white">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-navy" style={{ colorScheme: 'light' }}>
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-navy lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <Logo compact />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu">
          <MenuIcon size={24} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 bg-navy">
            <div className="flex justify-end p-2 text-white">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <CloseIcon size={24} />
              </button>
            </div>
            {sidebar}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <main className="p-4 sm:p-6 lg:ml-60 lg:p-8">
        <Suspense fallback={<div className="text-slate-500">Loading…</div>}>{children}</Suspense>
      </main>
    </div>
  );
}

function Guard({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <PageLoader label="Checking session" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'admin')
    return (
      <Shell>
        <Alert>You do not have permission to view this page.</Alert>
      </Shell>
    );
  return <Shell>{children}</Shell>;
}

function LoginRoute() {
  const { user, checking } = useAuth();
  if (checking) return <PageLoader label="Checking session" />;
  if (user) return <Navigate to="/admin" replace />;
  return <Login />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Admin · XYZ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Routes>
        <Route path="login" element={<LoginRoute />} />
        <Route index element={<Guard><Dashboard /></Guard>} />
        <Route path="enquiries" element={<Guard><Enquiries /></Guard>} />
        <Route path="enquiries/:id" element={<Guard><EnquiryDetail /></Guard>} />
        <Route path="technicians" element={<Guard><Technicians /></Guard>} />
        <Route path="services" element={<Guard adminOnly><ServicesAdmin /></Guard>} />
        <Route path="projects" element={<Guard adminOnly><ProjectsAdmin /></Guard>} />
        <Route path="testimonials" element={<Guard adminOnly><TestimonialsAdmin /></Guard>} />
        <Route path="settings" element={<Guard adminOnly><SettingsAdmin /></Guard>} />
        <Route path="users" element={<Guard adminOnly><UsersAdmin /></Guard>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
