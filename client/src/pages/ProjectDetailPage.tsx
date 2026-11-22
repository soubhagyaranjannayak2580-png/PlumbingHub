import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from '../components/layout/PublicLayout';
import PageHeader from '../components/layout/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import BeforeAfter from '../components/ui/BeforeAfter';
import { CheckIcon, CloseIcon, PinIcon } from '../components/ui/Icons';
import { Seo } from '../lib/seo';
import { api, ApiError } from '../lib/api';
import type { Project } from '../lib/types';
import NotFoundPage from './NotFoundPage';
import CtaBand from '../sections/CtaBand';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setProject(null);
    setError(null);
    api<Project>(`/api/projects/${slug}`, { signal: ac.signal })
      .then(setProject)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });
    return () => ac.abort();
  }, [slug]);

  useEffect(() => {
    if (lightbox === null || !project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => ((i ?? 0) + 1) % project.images.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => ((i ?? 0) - 1 + project.images.length) % project.images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, project]);

  if (error?.status === 404) return <NotFoundPage />;
  if (error) return <p className="container-site py-40 text-center text-white/70">{error.message}</p>;
  if (!project) return <PageLoader />;

  return (
    <PageTransition>
      <Seo title={`${project.title}${project.location ? `, ${project.location}` : ''}`} description={project.description.slice(0, 155)} />
      <PageHeader eyebrow={project.category} title={project.title} crumbs={[{ to: '/projects', label: 'Projects' }, { label: project.title }]}>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/65">
          {project.location && (
            <span className="flex items-center gap-1.5">
              <PinIcon size={16} className="text-electric" /> {project.location}
            </span>
          )}
          {project.completedOn && <span>Completed: {project.completedOn}</span>}
        </div>
      </PageHeader>

      <section className="bg-navy pb-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            {project.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.images.map((img, i) => (
                  <motion.button
                    key={img.src}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2 sm:col-span-2' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    aria-label={`Open image ${i + 1}`}
                  >
                    <img src={img.thumb ?? img.src} alt={img.alt || `${project.title} photo ${i + 1}`} loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </motion.button>
                ))}
              </div>
            )}
            {project.beforeImage && project.afterImage && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Before & after</h2>
                <BeforeAfter before={project.beforeImage} after={project.afterImage} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">Project description</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-white/70">{project.description}</p>
            </div>
          </div>
          <aside className="glass self-start rounded-3xl p-6">
            <h2 className="text-lg font-bold">Scope of work</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {project.scope.map((s) => (
                <li key={s} className="flex gap-2">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-electric" />
                  {s}
                </li>
              ))}
            </ul>
            <Link to="/book" className="btn-primary mt-6 w-full">
              Discuss a similar project
            </Link>
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {lightbox !== null && project.images[lightbox] && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2" aria-label="Close" onClick={() => setLightbox(null)}>
              <CloseIcon size={22} />
            </button>
            <motion.img
              key={lightbox}
              src={project.images[lightbox].src}
              alt={project.images[lightbox].alt || project.title}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <CtaBand />
    </PageTransition>
  );
}
