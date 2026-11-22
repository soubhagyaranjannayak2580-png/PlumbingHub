import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { useBusiness, telHref } from '../../lib/site';
import { AlertIcon, CloseIcon, MenuIcon, PhoneIcon } from '../ui/Icons';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/system', label: '3D System' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const business = useBusiness();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open ? 'border-b border-white/10 bg-navy/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-navy">
        Skip to content
      </a>
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label={`${business?.companyName ?? 'XYZ'} home`} className="shrink-0">
          <Logo name={business?.companyName} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'text-white' : 'text-white/65 hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/emergency" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-white">
            <AlertIcon size={16} /> Emergency
          </Link>
          {business?.phone && (
            <a href={telHref(business.phone)} className="btn-ghost !px-4 !py-2.5" aria-label={`Call ${business.phone}`}>
              <PhoneIcon size={16} /> {business.phone}
            </a>
          )}
          <Link to="/book" className="btn-primary !py-2.5">
            Free Quote
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100dvh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-y-auto bg-navy lg:hidden"
          >
            <div className="container-site flex flex-col gap-1 pb-32 pt-4">
              {[...NAV, { to: '/book', label: 'Book a Service' }, { to: '/emergency', label: 'Emergency Help' }].map((n, i) => (
                <motion.div key={n.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <NavLink
                    to={n.to}
                    end={n.to === '/'}
                    className={({ isActive }) =>
                      `block border-b border-white/10 py-4 font-display text-2xl font-semibold ${isActive ? 'text-electric' : 'text-white'}`
                    }
                  >
                    {n.label}
                  </NavLink>
                </motion.div>
              ))}
              {business?.phone && (
                <a href={telHref(business.phone)} className="btn-primary mt-6">
                  <PhoneIcon size={18} /> Call {business.phone}
                </a>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
