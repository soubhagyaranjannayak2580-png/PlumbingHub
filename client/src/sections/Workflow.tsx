import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionHeading from '../components/ui/SectionHeading';
import { usePrefersReducedMotion } from '../lib/device';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: '01', t: 'Customer Enquiry', d: 'Share your requirement online, by phone or WhatsApp. You receive a reference number to track it.', icon: 'M4 6h16v10H8l-4 4z' },
  { n: '02', t: 'Site Inspection', d: 'Our technical team visits the site to understand existing conditions, access and constraints.', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5' },
  { n: '03', t: 'Technical Assessment', d: 'We evaluate pressure, pipe sizing, drainage falls, materials and coordination needs.', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { n: '04', t: 'Quotation & Approval', d: 'A transparent quotation with scope, materials and timeline is shared for your approval.', icon: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h5' },
  { n: '05', t: 'Project Execution', d: 'Skilled teams execute to drawings with site supervision, safety and daily progress updates.', icon: 'M14.7 6.3a4 4 0 0 0 5 5L12 19l-4-4 7.7-7.7zM3 21l4-4' },
  { n: '06', t: 'Quality Inspection', d: 'Pressure testing, leak checks and flow tests are carried out before concealment and handover.', icon: 'M9 12l2 2 4-4M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z' },
  { n: '07', t: 'Project Handover', d: 'Clean handover with a walkthrough of valves, maintenance points and as-built details.', icon: 'M20 6 9 17l-5-5' },
];

export default function Workflow() {
  const reduce = usePrefersReducedMotion();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.wf-line',
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.wf-track', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } },
      );
      gsap.fromTo(
        '.wf-line-v',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.wf-track-v', start: 'top 75%', end: 'bottom 60%', scrub: 0.6 } },
      );
      gsap.from('.wf-node', {
        scale: 0.4,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: root.current, start: 'top 65%' },
      });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  const step = STEPS[active];

  return (
    <section ref={root} className="relative bg-navy py-24 sm:py-32" aria-labelledby="workflow-title">
      <div className="container-site">
        <div id="workflow-title">
          <SectionHeading
            eyebrow="How We Work"
            title="A clear, engineered process from first call to handover."
            intro="Seven disciplined stages keep every project predictable, transparent and on schedule."
          />
        </div>

        {/* Desktop: horizontal */}
        <div className="wf-track relative mt-16 hidden lg:block">
          <div className="absolute left-[4%] right-[4%] top-8 h-[3px] rounded bg-white/10" />
          <div className="wf-line absolute left-[4%] right-[4%] top-8 h-[3px] origin-left rounded bg-gradient-to-r from-electric via-electric to-accent" />
          <ol className="relative grid grid-cols-7 gap-3">
            {STEPS.map((s, i) => (
              <li key={s.n} className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  className={`wf-node relative grid h-16 w-16 place-items-center rounded-2xl border transition-all duration-300 ${
                    active === i ? 'scale-110 border-electric bg-electric text-white shadow-glow' : 'border-white/15 bg-midnight text-electric hover:border-electric'
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={s.icon} />
                  </svg>
                  <span className="sr-only">{s.t}</span>
                </button>
                <span className="mt-4 font-display text-xs font-bold text-accent">{s.n}</span>
                <span className={`mt-1 font-display text-sm font-semibold ${active === i ? 'text-white' : 'text-white/70'}`}>{s.t}</span>
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-10 max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-2xl p-6 text-center"
                aria-live="polite"
              >
                <p className="font-display text-lg font-semibold">
                  <span className="text-accent">{step.n}</span> — {step.t}
                </p>
                <p className="mt-2 text-white/70">{step.d}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile / tablet: vertical */}
        <div className="wf-track-v relative mt-12 lg:hidden">
          <div className="absolute bottom-2 left-7 top-2 w-[3px] rounded bg-white/10" aria-hidden />
          <div className="wf-line-v absolute bottom-2 left-7 top-2 w-[3px] origin-top rounded bg-gradient-to-b from-electric to-accent" aria-hidden />
        <ol className="relative space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex gap-5">
              <span className="wf-node relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-midnight text-electric">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={s.icon} />
                </svg>
              </span>
              <div className="pt-1">
                <p className="font-display text-xs font-bold text-accent">{s.n}</p>
                <h3 className="font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-white/65">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
