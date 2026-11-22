import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import PageLoader from '../components/ui/PageLoader';
import { useNearViewport, useOnScreen, usePrefersReducedMotion, useQuality } from '../lib/device';
import { CATEGORY_META, COMPONENTS, COMPONENT_BY_ID, VIEWS, type Category } from '../three/systemData';
import { CloseIcon } from '../components/ui/Icons';

const SystemScene = lazy(() => import('../three/SystemScene'));

function InfoPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const c = id ? COMPONENT_BY_ID[id] : null;
  return (
    <>
      {c ? (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass relative rounded-2xl p-5"
          aria-live="polite"
        >
          <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close details">
            <CloseIcon size={16} />
          </button>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: CATEGORY_META[c.category].color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[c.category].color }} />
            {CATEGORY_META[c.category].label}
          </span>
          <h3 className="mt-2 pr-6 text-xl font-bold">{c.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{c.description}</p>
          <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Purpose</p>
            <p className="mt-1 text-sm text-white/85">{c.purpose}</p>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-electric">Technical information</p>
          <ul className="mt-2 space-y-1.5 text-sm text-white/75">
            {c.specs.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-electric" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-white/40">Typical industry guidance – actual specifications are set per project design.</p>
        </motion.div>
      ) : (
        <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5 text-sm text-white/65">
          <p className="font-display text-base font-semibold text-white">Select any component</p>
          <p className="mt-2">Click a pipe, tank, valve or fixture in the model – or choose one from the list – to see what it does and its typical technical details.</p>
          <p className="mt-3 text-xs text-white/45">Drag to rotate · Scroll / pinch to zoom · Right-drag to pan</p>
        </motion.div>
      )}
    </>
  );
}

/** Accessible, non-3D alternative: browse components by category (also used as the low-power fallback). */
function ComponentList({ selected, onSelect, focus }: { selected: string | null; onSelect: (id: string) => void; focus: string[] | null }) {
  const cats = Object.keys(CATEGORY_META) as Category[];
  return (
    <div className="space-y-4">
      {cats.map((cat) => (
        <div key={cat}>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[cat].color }} />
            {CATEGORY_META[cat].label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COMPONENTS.filter((c) => c.category === cat).map((c) => {
              const dim = focus && !focus.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-pressed={selected === c.id}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selected === c.id
                      ? 'border-electric bg-electric text-white'
                      : `border-white/15 hover:border-electric hover:text-white ${dim ? 'text-white/35' : 'text-white/75'}`
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SystemExplorer({ headingAs = 'h2' }: { headingAs?: 'h1' | 'h2' }) {
  const quality = useQuality();
  const reduce = usePrefersReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const near = useNearViewport(wrap, '400px');
  const onScreen = useOnScreen(wrap);
  const [viewId, setViewId] = useState('overview');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const view = VIEWS.find((v) => v.id === viewId) ?? VIEWS[0];

  const onSelect = useCallback((id: string | null) => setSelected(id), []);
  const onHover = useCallback((id: string | null) => setHovered(id), []);

  return (
    <section id="system" className="relative overflow-hidden bg-navy py-24 sm:py-32" aria-labelledby="system-title">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[length:56px_56px] opacity-40" />
      <div className="container-site relative">
        <div id="system-title">
          <SectionHeading
            as={headingAs}
            eyebrow="Interactive 3D"
            title={<>UNDERSTANDING <span className="text-gradient">THE SYSTEM</span></>}
            intro="Explore how water reaches every tap and how wastewater safely leaves a building. Rotate, zoom and select components of a complete two-storey plumbing system."
          />
        </div>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="System views">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={v.id === viewId}
              onClick={() => {
                setViewId(v.id);
                setSelected(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                v.id === viewId ? 'bg-electric text-white shadow-glow' : 'border border-white/15 text-white/70 hover:border-electric hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-[1.5rem] text-sm text-white/60">{view.caption}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div
            ref={wrap}
            className="relative h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#06131f] sm:h-[560px] lg:h-[640px]"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (tipRef.current) tipRef.current.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
            }}
          >
            {quality === 'off' ? (
              <div className="flex h-full flex-col justify-center p-6">
                <p className="mb-4 text-sm text-white/60">
                  3D view is disabled on this device to save power. Browse the components below instead
                  <a className="ml-1 text-electric underline" href="?quality=low#system">
                    (or load the 3D model anyway)
                  </a>
                  .
                </p>
                <ComponentList selected={selected} onSelect={setSelected} focus={view.focus} />
              </div>
            ) : near ? (
              <Suspense fallback={<PageLoader label="Loading 3D model" />}>
                <SystemScene
                  view={view}
                  selected={selected}
                  hovered={hovered}
                  onSelect={onSelect}
                  onHover={onHover}
                  quality={quality}
                  animate={!reduce}
                  active={onScreen}
                />
              </Suspense>
            ) : (
              <PageLoader label="Loading 3D model" />
            )}
            <div
              ref={tipRef}
              className={`pointer-events-none absolute left-0 top-0 z-10 rounded-lg bg-navy/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/15 ${
                hovered && COMPONENT_BY_ID[hovered] ? '' : 'hidden'
              }`}
            >
              {hovered ? COMPONENT_BY_ID[hovered]?.name : ''}
            </div>
            {quality !== 'off' && (
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-navy/70 px-3 py-2 text-[11px] text-white/70 backdrop-blur">
                {(['supply', 'hot', 'drainage', 'storage'] as Category[]).map((c) => (
                  <span key={c} className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full" style={{ background: CATEGORY_META[c].color }} />
                    {CATEGORY_META[c].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <InfoPanel id={selected} onClose={() => setSelected(null)} />
            {quality !== 'off' && (
              <details className="glass rounded-2xl p-5" open={false}>
                <summary className="cursor-pointer font-display text-sm font-semibold">Browse all components</summary>
                <div className="mt-4">
                  <ComponentList selected={selected} onSelect={setSelected} focus={view.focus} />
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
