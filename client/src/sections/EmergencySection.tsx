import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EnquiryForm from '../forms/EnquiryForm';
import MagneticButton from '../components/ui/MagneticButton';
import { AlertIcon, ClockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../components/ui/Icons';
import { formatAddress, telHref, useBusiness, whatsappHref } from '../lib/site';

const TIPS = [
  'Shut the main stop valve or overhead-tank outlet valve to stop the flow.',
  'Switch off the water pump and geyser; isolate electricity near any leak.',
  'Move valuables away from water and photograph the damage.',
  'Do not use chemical drain cleaners on sewage back-ups.',
];

export default function EmergencySection({ withForm = true, headingAs = 'h2' }: { withForm?: boolean; headingAs?: 'h1' | 'h2' }) {
  const b = useBusiness();
  const H = headingAs;
  const availability = b?.emergency.available24x7
    ? 'Emergency support available 24/7.'
    : b?.workingHours
      ? `Emergency requests are prioritised during working hours: ${b.workingHours}.`
      : 'Emergency requests are prioritised and handled as quickly as our team is available.';

  return (
    <section id="emergency" className="relative overflow-hidden bg-gradient-to-br from-[#2a0f0a] via-navy to-navy py-24 sm:py-28" aria-labelledby="emergency-title">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />
      <div className="container-site relative grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-accent" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Emergency Plumbing
          </motion.span>
          <H id="emergency-title" className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
            PLUMBING EMERGENCY? <span className="text-accent">WE’RE READY TO HELP.</span>
          </H>
          <p className="mt-5 max-w-xl text-white/70">
            Burst pipes, major leaks, overflowing drains or no water supply — contact us immediately and our team will prioritise your request.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {b?.phone ? (
              <MagneticButton href={telHref(b.phone)} className="btn-accent !px-7 !py-4 text-base" ariaLabel={`Emergency call ${b.phone}`}>
                <PhoneIcon size={20} /> Emergency Call Now
              </MagneticButton>
            ) : null}
            {b?.whatsapp && (
              <MagneticButton
                href={whatsappHref(b.whatsapp, 'EMERGENCY: I need urgent plumbing help. My location is: ')}
                external
                className="btn !px-7 !py-4 bg-[#25D366] text-base text-white hover:brightness-110"
              >
                <WhatsAppIcon size={20} /> WhatsApp Us
              </MagneticButton>
            )}
            {!withForm && (
              <Link to="/emergency" className="btn-ghost !px-7 !py-4 text-base">
                Request Immediate Assistance
              </Link>
            )}
          </div>
          {!b?.phone && !b?.whatsapp && (
            <p className="mt-4 text-sm text-white/55">Use the assistance form to reach our team — your request is flagged as an emergency.</p>
          )}

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            <li className="glass flex gap-3 rounded-2xl p-4">
              <ClockIcon size={22} className="shrink-0 text-accent" />
              <div>
                <p className="font-display text-sm font-semibold">Availability</p>
                <p className="mt-1 text-sm text-white/65">{availability}</p>
                {b?.emergency.note && <p className="mt-1 text-sm text-white/65">{b.emergency.note}</p>}
              </div>
            </li>
            <li className="glass flex gap-3 rounded-2xl p-4">
              <PinIcon size={22} className="shrink-0 text-accent" />
              <div>
                <p className="font-display text-sm font-semibold">Coverage</p>
                <p className="mt-1 text-sm text-white/65">{(b?.serviceAreas ?? []).join(', ')} and across Delhi NCR.</p>
                {formatAddress(b) && <p className="mt-1 text-xs text-white/45">Office: {formatAddress(b)}</p>}
              </div>
            </li>
          </ul>

          <div className="mt-8 rounded-2xl border border-white/10 p-5">
            <p className="flex items-center gap-2 font-display text-sm font-semibold">
              <AlertIcon size={18} className="text-accent" /> While you wait
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/65">
              {TIPS.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {withForm && (
          <div className="glass self-start rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold">Request Immediate Assistance</h3>
            <p className="mt-1 text-sm text-white/60">Submitted requests are flagged as emergencies in our system.</p>
            <div className="mt-6">
              <EnquiryForm variant="emergency" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
