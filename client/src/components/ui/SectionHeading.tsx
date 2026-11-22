import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  as?: 'h1' | 'h2';
}

export default function SectionHeading({ eyebrow, title, intro, align = 'left', tone = 'dark', as = 'h2' }: Props) {
  const H = as;
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className={`eyebrow ${align === 'center' ? 'justify-center' : ''}`}>{eyebrow}</span>
      <H className={`mt-4 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl ${tone === 'light' ? 'text-navy' : 'text-white'}`}>
        {title}
      </H>
      {intro && <p className={`mt-5 text-base leading-relaxed sm:text-lg ${tone === 'light' ? 'text-slate-600' : 'text-white/65'}`}>{intro}</p>}
    </Reveal>
  );
}
