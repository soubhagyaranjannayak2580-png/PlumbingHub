import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { MouseEvent } from 'react';
import SectionHeading from '../components/ui/SectionHeading';
import ServiceIcon from '../components/ui/ServiceIcon';
import { ArrowIcon, CheckIcon } from '../components/ui/Icons';
import { rise, stagger } from '../components/ui/Reveal';
import { useSite } from '../lib/site';
import type { Service } from '../lib/types';

function ServiceCard({ s, index }: { s: Service; index: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);
  const glow = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(320px circle at ${x} ${y}, rgba(22,139,255,.12), transparent 60%)`);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.article
      variants={rise}
      onMouseMove={reduce ? undefined : onMove}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-navy shadow-card transition-[box-shadow,border-color] duration-300 hover:border-electric/50 hover:shadow-glow"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow }}
      />
      <div className="relative flex items-start justify-between">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mist text-midnight transition-colors duration-300 group-hover:bg-navy group-hover:text-white">
          <ServiceIcon icon={s.icon} className="h-10 w-10" />
        </div>
        <span className="font-display text-sm font-semibold text-slate-300">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="relative mt-6 text-xl font-bold">{s.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{s.summary}</p>
      <ul className="relative mt-4 space-y-1.5 text-sm text-slate-700">
        {s.features.slice(0, 4).map((f) => (
          <li key={f} className="flex gap-2">
            <CheckIcon size={16} className="mt-0.5 shrink-0 text-electric" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={`/services/${s.slug}`}
        className="relative mt-auto inline-flex items-center gap-2 pt-6 font-display text-sm font-semibold text-electric after:absolute after:inset-0 after:content-['']"
        aria-label={`Learn more about ${s.title}`}
      >
        Learn More <ArrowIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}

export default function ServicesGrid({ limit, headingAs = 'h2' }: { limit?: number; headingAs?: 'h1' | 'h2' }) {
  const { data, loading, error } = useSite();
  const services = (data?.services ?? []).slice(0, limit);
  return (
    <section id="services" className="relative bg-mist py-24 text-navy sm:py-32" aria-labelledby="services-title">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div id="services-title">
            <SectionHeading
              as={headingAs}
              tone="light"
              eyebrow="Our Services"
              title="Complete plumbing & engineering, from design to handover."
              intro="Residential, commercial and industrial plumbing delivered by a team that plans, installs, tests and documents every system."
            />
          </div>
          <Link to="/book" className="btn-dark shrink-0">
            Discuss your project <ArrowIcon size={16} />
          </Link>
        </div>
        {error && <p className="mt-10 rounded-xl bg-red-50 p-4 text-sm text-red-700">Services could not be loaded: {error}</p>}
        {loading && !data && <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white" />)}</div>}
        <motion.div
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {services.map((s, i) => (
            <ServiceCard key={s.slug} s={s} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
