import { useEffect, useState } from 'react';

export type Quality = 'off' | 'low' | 'high';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Decides how much 3D to render: none (static fallback), a lighter scene, or the full scene. */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'off';
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('quality');
  if (forced === 'off' || forced === 'low' || forced === 'high') return forced;
  if (!hasWebGL()) return 'off';
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return 'off';
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return 'off';
  const small = window.matchMedia('(max-width: 768px)').matches;
  if (small || cores <= 4 || memory <= 4) return 'low';
  return 'high';
}

export function useQuality() {
  const [q] = useState<Quality>(() => detectQuality());
  return q;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** True once the element has come near the viewport (used to lazy-mount 3D canvases). */
export function useNearViewport<T extends Element>(ref: React.RefObject<T>, rootMargin = '200px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}

/** Whether the element is currently on screen (used to pause render loops when off-screen). */
export function useOnScreen<T extends Element>(ref: React.RefObject<T>) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOn(entries[0]?.isIntersecting ?? false), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}
