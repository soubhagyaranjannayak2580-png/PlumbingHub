import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SectionHeading from '../components/ui/SectionHeading';
import { QuoteIcon, StarIcon } from '../components/ui/Icons';
import { useSite } from '../lib/site';
import { usePrefersReducedMotion } from '../lib/device';

export default function Testimonials() {
  const { data } = useSite();
  const items = data?.testimonials ?? [];
  const reduce = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || reduce || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length, reduce, paused]);

  const t = items[i % Math.max(items.length, 1)];

  return (
    <section className="relative bg-mist py-24 text-navy sm:py-32" aria-labelledby="testimonials-title">
      <div className="container-site">
        <div id="testimonials-title">
          <SectionHeading tone="light" align="center" eyebrow="Client Feedback" title="What our clients say" />
        </div>

        {items.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <QuoteIcon className="mx-auto text-electric/40" />
            <p className="mt-4 font-display text-lg font-semibold">Verified client reviews coming soon</p>
            <p className="mt-2 text-sm text-slate-600">
              We only publish feedback from real, verified clients. Worked with us?{' '}
              <Link to="/contact" className="font-semibold text-electric underline">
                Share your experience
              </Link>
              .
            </p>
          </div>
        ) : (
          <div
            className="relative mx-auto mt-12 max-w-3xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className="card-light relative min-h-[260px] overflow-hidden p-8 sm:p-12">
              <QuoteIcon size={48} className="absolute right-8 top-8 text-electric/15" />
              <AnimatePresence mode="wait">
                <motion.figure
                  key={t.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {t.rating !== null && (
                    <div className="flex gap-1 text-accent" aria-label={`Rated ${t.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, k) => (
                        <StarIcon key={k} filled={k < (t.rating ?? 0)} />
                      ))}
                    </div>
                  )}
                  <blockquote className="mt-5 text-lg leading-relaxed text-slate-700 sm:text-xl">“{t.feedback}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-navy font-display font-bold text-white" aria-hidden>
                      {t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span>
                      <span className="block font-display font-semibold">{t.name}</span>
                      <span className="block text-sm text-slate-500">{[t.projectType, t.location].filter(Boolean).join(' · ')}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
            {items.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {items.map((x, k) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setI(k)}
                    aria-label={`Show testimonial ${k + 1}`}
                    aria-current={k === i}
                    className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-electric' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
