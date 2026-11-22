import { lazy, Suspense, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticButton from '../components/ui/MagneticButton';
import { ArrowIcon } from '../components/ui/Icons';
import { useOnScreen, usePrefersReducedMotion, useQuality } from '../lib/device';
import HeroFallback from './HeroFallback';

gsap.registerPlugin(ScrollTrigger);

const HeroScene = lazy(() => import('../three/HeroScene'));

const LINE_1 = ['ENGINEERING', 'WATER', 'FLOW.'];
const LINE_2 = ['BUILDING', 'BETTER', 'FUTURES.'];

const CHIPS = [
  { k: 'Supply', v: 'Hot & cold water systems' },
  { k: 'Drainage', v: 'Soil, waste & sewer' },
  { k: 'MEP', v: 'Design → execution' },
];

export default function Hero() {
  const quality = useQuality();
  const reduce = usePrefersReducedMotion();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const onScreen = useOnScreen(section);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (s) => {
          progress.current = s.progress;
        },
      });
      if (!reduce) {
        gsap.to('.hero-copy', {
          yPercent: -14,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom 25%', scrub: true },
        });
        gsap.to('.hero-chips', {
          y: -80,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: 'center top', scrub: true },
        });
      }
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  const word = (w: string, i: number, offset: number, accent = false) => (
    <span key={w} className="inline-block overflow-hidden pb-1 align-bottom">
      <motion.span
        className={`inline-block ${accent ? 'text-gradient' : ''}`}
        initial={reduce ? false : { y: '110%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay: 0.25 + (offset + i) * 0.09, ease: [0.16, 1, 0.3, 1] }}
      >
        {w}&nbsp;
      </motion.span>
    </span>
  );

  return (
    <section ref={section} className="relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-navy" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10">
        {quality === 'off' ? (
          <HeroFallback />
        ) : (
          <Suspense fallback={<HeroFallback />}>
            <HeroScene progress={progress} quality={quality} animate={!reduce} active={onScreen} />
          </Suspense>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(7,24,39,.85)_0%,rgba(7,24,39,.35)_45%,transparent_75%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-navy to-transparent" />
      </div>

      <div className="container-site flex h-full flex-col justify-center pt-20">
        <div className="hero-copy max-w-4xl">
          <motion.span
            className="eyebrow"
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Plumbing Contractor · Delhi NCR
          </motion.span>
          <h1 id="hero-title" className="mt-5 font-display text-[2.35rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
            <span className="block">{LINE_1.map((w, i) => word(w, i, 0, i === 1))}</span>
            <span className="block">{LINE_2.map((w, i) => word(w, i, 3))}</span>
          </h1>
          <motion.p
            className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9 }}
          >
            Professional Plumbing Solutions. Reliable Engineering. Complete Project Execution Across Delhi NCR.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05 }}
          >
            <MagneticButton to="/book" className="btn-primary !px-7 !py-4 text-base">
              Request a Free Quote <ArrowIcon size={18} />
            </MagneticButton>
            <MagneticButton to="/services" className="btn-ghost !px-7 !py-4 text-base">
              Explore Our Services
            </MagneticButton>
          </motion.div>
        </div>

        <div className="hero-chips absolute bottom-10 right-4 hidden flex-col gap-3 sm:right-8 lg:flex">
          {CHIPS.map((c, i) => (
            <motion.div
              key={c.k}
              className="glass flex items-center gap-3 rounded-xl px-4 py-3"
              initial={reduce ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 + i * 0.12, duration: 0.8 }}
            >
              <span className="h-2 w-2 rounded-full bg-electric shadow-[0_0_12px_#168BFF]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric">{c.k}</span>
              <span className="text-sm text-white/80">{c.v}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <a href="#services" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white sm:flex">
        Scroll
        <span className="relative h-10 w-[22px] rounded-full border border-white/30">
          <motion.span
            className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-electric"
            animate={reduce ? undefined : { y: [0, 14, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        </span>
      </a>
    </section>
  );
}
