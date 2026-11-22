/** Lightweight static/CSS pipe illustration used on low-power devices, without WebGL, or while 3D loads. */
export default function HeroFallback() {
  const pipes = [
    'M-40 520 H420 V360 H760 V240 H1640',
    'M-40 640 H560 V470 H960 V330 H1300 V200',
    'M1100 900 V560 H1400 V420 H1640',
    'M300 -20 V180 H620 V120 H1100',
  ];
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,#0f3456_0%,#071827_65%)]" aria-hidden>
      <div className="absolute inset-0 bg-grid bg-[length:48px_48px] opacity-60" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hf-pipe" x1="0" x2="1">
            <stop offset="0" stopColor="#9fd0ff" stopOpacity=".25" />
            <stop offset="1" stopColor="#168BFF" stopOpacity=".35" />
          </linearGradient>
        </defs>
        {pipes.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="url(#hf-pipe)" strokeWidth={i === 0 ? 30 : 22} fill="none" strokeLinejoin="round" />
            <path d={d} stroke="#168BFF" strokeOpacity=".9" strokeWidth={i === 0 ? 10 : 7} fill="none" strokeDasharray="14 26" strokeLinejoin="round" className="animate-flow" style={{ animationDuration: `${1.2 + i * 0.3}s` }} />
          </g>
        ))}
        {[
          [420, 520],
          [760, 360],
          [560, 640],
          [960, 470],
          [1400, 560],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="22" fill="#0B2239" stroke="#c9d3de" strokeWidth="6" />
        ))}
      </svg>
    </div>
  );
}
