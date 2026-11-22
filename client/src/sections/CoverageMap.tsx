import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AREAS } from '../content/areas';

// Schematic (not to scale) positions of NCR cities relative to central Delhi.
const POS: Record<string, [number, number]> = {
  delhi: [210, 150],
  gurugram: [120, 250],
  noida: [305, 185],
  'greater-noida': [370, 260],
  faridabad: [235, 300],
};

export default function CoverageMap() {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6">
      <p className="font-display text-sm font-semibold">Service coverage — Delhi NCR</p>
      <p className="text-xs text-white/50">Schematic map (not to scale). Select a city for local information.</p>
      <svg viewBox="0 0 460 360" className="mt-4 w-full" role="img" aria-label="Service coverage across Delhi, Gurugram, Noida, Faridabad and Greater Noida">
        <defs>
          <radialGradient id="cov" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#168BFF" stopOpacity=".35" />
            <stop offset="1" stopColor="#168BFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="240" cy="220" rx="215" ry="150" fill="url(#cov)" />
        <ellipse cx="240" cy="220" rx="215" ry="150" fill="none" stroke="#168BFF" strokeOpacity=".35" strokeDasharray="4 6" />
        {/* Yamuna (schematic) */}
        <path d="M250 10 C 270 90, 240 150, 275 210 S 290 320, 300 360" stroke="#3aa0ff" strokeOpacity=".35" strokeWidth="6" fill="none" />
        {Object.entries(POS)
          .filter(([k]) => k !== 'delhi')
          .map(([k, [x, y]]) => (
            <motion.path
              key={k}
              d={`M${POS.delhi[0]} ${POS.delhi[1]} L${x} ${y}`}
              fill="none"
              stroke="#168BFF"
              strokeOpacity=".55"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            />
          ))}
        {AREAS.map((a) => {
          const [x, y] = POS[a.slug];
          return (
            <Link key={a.slug} to={`/plumbing-contractor/${a.slug}`} aria-label={`Plumbing contractor in ${a.name}`}>
              <g className="group cursor-pointer">
                <circle cx={x} cy={y} r="18" fill="#168BFF" fillOpacity=".15" className="transition group-hover:fill-opacity-40" />
                <circle cx={x} cy={y} r="6" fill={a.slug === 'delhi' ? '#FF8A32' : '#168BFF'} />
                <text x={x} y={y - 24} textAnchor="middle" className="fill-white font-display text-[13px] font-semibold">
                  {a.name}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
    </div>
  );
}
