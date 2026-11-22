import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import { ArrowIcon, PinIcon } from '../components/ui/Icons';
import { useSite } from '../lib/site';

export default function ProjectsShowcase({ limit, headingAs = 'h2' }: { limit?: number; headingAs?: 'h1' | 'h2' }) {
  const { data, loading } = useSite();
  const categories = data?.options.projectCategories ?? [];
  const [cat, setCat] = useState<string>('All');
  const projects = useMemo(() => {
    const all = data?.projects ?? [];
    const list = cat === 'All' ? all : all.filter((p) => p.category === cat);
    return limit ? list.slice(0, limit) : list;
  }, [data, cat, limit]);
  const total = data?.projects.length ?? 0;

  return (
    <section className="relative bg-navy py-24 sm:py-32" aria-labelledby="projects-title">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div id="projects-title">
            <SectionHeading
              as={headingAs}
              eyebrow="Project Portfolio"
              title="Projects engineered to perform."
              intro="Residential, commercial, industrial, bathroom, water supply and drainage work delivered across Delhi NCR."
            />
          </div>
          {limit && total > 0 && (
            <Link to="/projects" className="btn-ghost shrink-0">
              View all projects <ArrowIcon size={16} />
            </Link>
          )}
        </div>

        {total > 0 && (
          <div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Project categories">
            {['All', ...categories].map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${cat === c ? 'bg-white text-navy' : 'border border-white/15 text-white/70 hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading && !data ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="mt-12 grid gap-6 rounded-3xl border border-dashed border-white/15 p-10 text-center md:grid-cols-3 md:text-left">
            <div className="md:col-span-2">
              <p className="font-display text-xl font-semibold">Our project portfolio is being curated</p>
              <p className="mt-2 text-white/60">
                We are documenting completed projects with real site photographs. Want to see relevant work for your requirement? Ask our team for references.
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <Link to="/contact" className="btn-primary">
                Request project references
              </Link>
            </div>
          </div>
        ) : (
          <motion.div layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {projects.map((p, i) => {
                const cover = p.images[0] ?? p.afterImage ?? p.beforeImage;
                return (
                  <motion.article
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-midnight"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {cover ? (
                        <img
                          src={cover.thumb ?? cover.src}
                          srcSet={cover.thumb ? `${cover.thumb} 800w, ${cover.src} 1800w` : undefined}
                          sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                          alt={cover.alt || p.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-midnight to-electric/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-navy/70 px-3 py-1 text-xs backdrop-blur">{p.category}</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      {p.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
                          <PinIcon size={14} /> {p.location}
                        </p>
                      )}
                      <p className="mt-3 line-clamp-2 text-sm text-white/65">{p.description}</p>
                      <Link to={`/projects/${p.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-electric after:absolute after:inset-0">
                        View project <ArrowIcon size={14} />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
        {total > 0 && projects.length === 0 && <p className="mt-10 text-white/60">No projects in this category yet.</p>}
      </div>
    </section>
  );
}
