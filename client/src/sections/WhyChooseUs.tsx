import { motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import Counter from '../components/ui/Counter';
import { rise, stagger } from '../components/ui/Reveal';
import { useBusiness } from '../lib/site';

const PILLARS = [
  { t: 'Engineered, not improvised', d: 'Every job starts with a site inspection and technical assessment before work begins.' },
  { t: 'Transparent quotations', d: 'Clear scope, materials and timelines approved by you before execution.' },
  { t: 'Tested before handover', d: 'Supply lines are pressure-tested and drainage flow-tested before concealment and handover.' },
  { t: 'One team, end to end', d: 'Design, coordination, installation and maintenance handled by a single accountable team.' },
];

export default function WhyChooseUs() {
  const business = useBusiness();
  const stats = business?.stats ?? [];
  return (
    <section className="relative overflow-hidden bg-midnight py-24 sm:py-32" aria-labelledby="why-title">
      <div className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-electric/20 blur-[140px]" />
      <div className="container-site relative">
        <div id="why-title">
          <SectionHeading
            eyebrow="Why Choose Us"
            title={<>Precision engineering. <span className="text-gradient">Dependable delivery.</span></>}
            intro="Built on technical know-how and disciplined project execution across Delhi NCR."
          />
        </div>

        <motion.dl
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3 lg:grid-cols-5"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {stats.map((s) => (
            <motion.div key={s.key} variants={rise} className="flex flex-col-reverse bg-midnight p-6 sm:p-8">
              <dt className="mt-2 text-sm text-white/60">{s.label}</dt>
              <dd className="font-display text-4xl font-extrabold text-white sm:text-5xl">
                {s.value !== null ? (
                  <Counter value={s.value} suffix={s.suffix} />
                ) : (
                  <span className="text-white/25" title="Figure to be confirmed">
                    —
                  </span>
                )}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
        {stats.some((s) => s.value === null) && (
          <p className="mt-3 text-xs text-white/40">Figures shown as “—” are being verified and will be published soon.</p>
        )}

        <motion.div
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {PILLARS.map((p, i) => (
            <motion.div key={p.t} variants={rise} className="glass group rounded-2xl p-6 transition hover:border-electric/40">
              <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{p.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
