import MagneticButton from '../components/ui/MagneticButton';
import { ArrowIcon } from '../components/ui/Icons';
import { Reveal } from '../components/ui/Reveal';

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-electric py-20 noise">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="none" viewBox="0 0 1200 300" aria-hidden>
        <path d="M0 220 H300 V120 H700 V60 H1200" stroke="#fff" strokeWidth="18" fill="none" />
        <path d="M0 220 H300 V120 H700 V60 H1200" stroke="#071827" strokeWidth="5" fill="none" strokeDasharray="10 20" className="animate-flow" />
      </svg>
      <Reveal className="container-site relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">Planning a project or facing a plumbing problem?</h2>
          <p className="mt-3 max-w-xl text-white/85">Get a site inspection and a transparent quotation from our engineering team.</p>
        </div>
        <MagneticButton to="/book" className="btn shrink-0 bg-navy !px-8 !py-4 text-base text-white hover:bg-midnight">
          Request a Free Quote <ArrowIcon size={18} />
        </MagneticButton>
      </Reveal>
    </section>
  );
}
