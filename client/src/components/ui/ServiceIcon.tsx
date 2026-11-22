import type { ServiceIcon as IconKey } from '../../lib/types';

/**
 * Line-art technical illustrations for each service. The `.flow` paths animate (water flow)
 * when the parent card (`group`) is hovered.
 */
const ICONS: Record<IconKey, JSX.Element> = {
  residential: (
    <>
      <path d="M8 30 32 10l24 20" />
      <path d="M14 26v28h36V26" />
      <path d="M27 54V40h10v14" />
      <path className="flow" d="M20 34h8M44 30v10h-6" />
      <circle cx="44" cy="44" r="2.5" />
    </>
  ),
  commercial: (
    <>
      <rect x="12" y="10" width="24" height="44" rx="1.5" />
      <rect x="36" y="22" width="16" height="32" rx="1.5" />
      <path d="M18 18h4M26 18h4M18 26h4M26 26h4M18 34h4M26 34h4M42 30h4M42 38h4" />
      <path className="flow" d="M8 54h48M30 54v-8" />
    </>
  ),
  industrial: (
    <>
      <path d="M8 54V30l12 8v-8l12 8v-8l12 8V14h8v40z" />
      <path className="flow" d="M14 46h6M26 46h6M38 46h6" />
      <path d="M44 14V8h8v6" />
    </>
  ),
  bathroom: (
    <>
      <path d="M10 34h44v6a12 12 0 0 1-12 12H22a12 12 0 0 1-12-12z" />
      <path d="M16 34V14a6 6 0 0 1 12 0" />
      <path d="M24 16h8" />
      <path className="flow" d="M28 22v4M28 30v2" />
      <path d="M18 52l-2 4M46 52l2 4" />
    </>
  ),
  supply: (
    <>
      <path d="M14 10h20v14H14z" />
      <path d="M14 14h20" />
      <path className="flow" d="M24 24v14h20v14" />
      <circle cx="44" cy="38" r="5" />
      <path d="M40 52h8" />
      <path d="M10 52h12" />
    </>
  ),
  drainage: (
    <>
      <path d="M10 14h18v10" />
      <path d="M28 24v16l8 8h18" />
      <path className="flow" d="M14 14h10M28 30v8M38 48h12" />
      <rect x="40" y="40" width="14" height="16" rx="1" />
    </>
  ),
  maintenance: (
    <>
      <path d="M40 10a10 10 0 0 0-9.4 13.4L12 42l10 10 18.6-18.6A10 10 0 1 0 40 10z" />
      <circle cx="40" cy="20" r="3" />
      <path className="flow" d="M16 46l4 4" />
    </>
  ),
  mep: (
    <>
      <rect x="10" y="10" width="44" height="44" rx="2" />
      <path d="M10 24h44M10 40h44M24 10v44M40 10v44" strokeOpacity=".35" />
      <path className="flow" d="M16 48V32h16V18h16" />
      <circle cx="16" cy="48" r="2.5" />
      <circle cx="48" cy="18" r="2.5" />
    </>
  ),
};

export default function ServiceIcon({ icon, className = '' }: { icon: IconKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`service-icon ${className}`}
      aria-hidden
    >
      {ICONS[icon] ?? ICONS.residential}
    </svg>
  );
}
