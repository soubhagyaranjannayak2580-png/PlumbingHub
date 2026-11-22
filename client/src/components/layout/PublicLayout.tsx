import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { telHref, useBusiness, whatsappHref } from '../../lib/site';
import { PhoneIcon, WhatsAppIcon } from '../ui/Icons';

function FloatingContact() {
  const b = useBusiness();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!b?.whatsapp && !b?.phone) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-5 right-4 z-40 flex flex-col gap-3 sm:right-6"
        >
          {b.whatsapp && (
            <a
              href={whatsappHref(b.whatsapp, 'Hello, I need help with plumbing.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
            >
              <span className="absolute inset-0 animate-pulseRing rounded-full bg-[#25D366]/50" aria-hidden />
              <WhatsAppIcon size={28} />
            </a>
          )}
          {b.phone && (
            <a href={telHref(b.phone)} aria-label={`Call ${b.phone}`} className="grid h-14 w-14 place-items-center rounded-full bg-electric text-white shadow-glow transition hover:scale-105 sm:hidden">
              <PhoneIcon size={24} />
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div id="main" className="flex-1">
        {children}
      </div>
      <Footer />
      <FloatingContact />
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.main>
  );
}
