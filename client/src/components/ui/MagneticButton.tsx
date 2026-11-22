import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ReactNode, MouseEvent } from 'react';

interface Props {
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  strength?: number;
  ariaLabel?: string;
  external?: boolean;
}

/** CTA that subtly follows the cursor. Disabled for touch and reduced-motion users. */
export default function MagneticButton({ to, href, onClick, className = 'btn-primary', children, strength = 0.3, ariaLabel, external }: Props) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 15, mass: 0.4 });

  const onMove = (e: MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const inner = <motion.span style={{ x: sx, y: sy }} className="relative inline-flex items-center gap-2">{children}</motion.span>;
  const common = { className, onMouseMove: onMove, onMouseLeave: reset, 'aria-label': ariaLabel };

  if (to) return <Link to={to} {...common}>{inner}</Link>;
  if (href)
    return (
      <a href={href} {...common} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} {...common}>
      {inner}
    </button>
  );
}
