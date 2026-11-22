import { useRef, useState, type PointerEvent } from 'react';
import type { ImageRef } from '../../lib/types';

/** Draggable before/after comparison slider (keyboard accessible via the range input). */
export default function BeforeAfter({ before, after }: { before: ImageRef; after: ImageRef }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (e: PointerEvent) => {
    if (!dragging.current || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={box}
      className="relative aspect-[16/10] select-none overflow-hidden rounded-3xl border border-white/10"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={() => (dragging.current = false)}
      style={{ touchAction: 'pan-y' }}
    >
      <img src={after.src} alt={after.alt || 'After'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before.src} alt={before.alt || 'Before'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-navy/80 px-3 py-1 text-xs font-semibold">Before</span>
      <span className="absolute right-4 top-4 rounded-full bg-electric px-3 py-1 text-xs font-semibold">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-lg">⇆</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Before and after comparison"
        className="absolute inset-x-0 bottom-0 h-1 w-full cursor-pointer opacity-0 focus:opacity-100"
      />
    </div>
  );
}
