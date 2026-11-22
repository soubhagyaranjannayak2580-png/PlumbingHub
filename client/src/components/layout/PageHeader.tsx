import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Crumb {
  to?: string;
  label: string;
}

export default function PageHeader({ eyebrow, title, intro, crumbs = [], children }: { eyebrow: string; title: ReactNode; intro?: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-navy pb-16 pt-36 sm:pb-20 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-electric/25 blur-[140px]" />
      <div className="container-site relative">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/50">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  {c.to ? (
                    <Link to={c.to} className="hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white/80">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <motion.span className="eyebrow" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          {eyebrow}
        </motion.span>
        <motion.h1
          className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
        </motion.h1>
        {intro && (
          <motion.p className="mt-5 max-w-2xl text-lg text-white/65" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }}>
            {intro}
          </motion.p>
        )}
        {children}
      </div>
    </header>
  );
}
