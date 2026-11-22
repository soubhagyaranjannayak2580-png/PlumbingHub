export default function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <svg width="64" height="24" viewBox="0 0 64 24" aria-hidden>
          <path d="M2 12 H62" stroke="rgba(255,255,255,.15)" strokeWidth="8" strokeLinecap="round" />
          <path d="M2 12 H62" stroke="#168BFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 12" className="animate-flow" />
        </svg>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">{label}…</span>
      </div>
    </div>
  );
}
