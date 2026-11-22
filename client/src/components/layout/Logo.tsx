export default function Logo({ name = 'XYZ', compact = false }: { name?: string; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden>
        <defs>
          <linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6fb8ff" />
            <stop offset="1" stopColor="#168BFF" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="10" fill="#0B2239" stroke="url(#lg-logo)" strokeWidth="1.5" />
        <path d="M9 13h9a5 5 0 0 1 5 5v4a5 5 0 0 0 5 5h3" stroke="url(#lg-logo)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="31" cy="27" r="3" fill="#FF8A32" />
        <rect x="7" y="10.5" width="3" height="5" rx="1" fill="#e2ecf7" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-lg font-extrabold tracking-tight">{name}</span>
        {!compact && <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">Plumbing & Engineering</span>}
      </span>
    </span>
  );
}
