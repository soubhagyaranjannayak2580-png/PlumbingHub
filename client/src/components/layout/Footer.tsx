import { Link } from 'react-router-dom';
import Logo from './Logo';
import { brandName, formatAddress, telHref, useSite, whatsappHref } from '../../lib/site';
import { AREAS } from '../../content/areas';
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../ui/Icons';

export default function Footer() {
  const { data } = useSite();
  const b = data?.business ?? null;
  const address = formatAddress(b);
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-navy-950 pt-16">
      <div className="container-site grid gap-12 pb-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo name={b?.companyName} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            {b?.tagline || 'Plumbing Contractor & Engineering Services'} for residential, commercial and industrial projects across Delhi NCR.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {b?.whatsapp && (
              <a href={whatsappHref(b.whatsapp, 'Hello, I would like to enquire about plumbing services.')} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-4 !py-2 text-xs">
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
            )}
            <Link to="/book" className="btn-primary !px-4 !py-2 text-xs">
              Request a Free Quote
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Services</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-white/60">
            {(data?.services ?? []).map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="hover:text-electric">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Service Areas</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-white/60">
            {AREAS.map((a) => (
              <li key={a.slug}>
                <Link to={`/plumbing-contractor/${a.slug}`} className="hover:text-electric">
                  Plumbing Contractor in {a.name}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Company</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-white/60">
            <li><Link to="/projects" className="hover:text-electric">Projects</Link></li>
            <li><Link to="/system" className="hover:text-electric">3D Plumbing System</Link></li>
            <li><Link to="/emergency" className="hover:text-electric">Emergency Help</Link></li>
            <li><Link to="/contact" className="hover:text-electric">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Get in Touch</h2>
          <ul className="mt-5 space-y-4 text-sm text-white/70">
            {b?.phone && (
              <li className="flex gap-3">
                <PhoneIcon size={18} className="mt-0.5 shrink-0 text-electric" />
                <a href={telHref(b.phone)} className="hover:text-white">{b.phone}</a>
              </li>
            )}
            {b?.email && (
              <li className="flex gap-3">
                <MailIcon size={18} className="mt-0.5 shrink-0 text-electric" />
                <a href={`mailto:${b.email}`} className="break-all hover:text-white">{b.email}</a>
              </li>
            )}
            {address && (
              <li className="flex gap-3">
                <PinIcon size={18} className="mt-0.5 shrink-0 text-electric" />
                <span>{address}</span>
              </li>
            )}
            {!b?.phone && !b?.email && !address && (
              <li className="text-white/50">
                Use our <Link to="/contact" className="text-electric underline">enquiry form</Link> and our team will get back to you.
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/45 sm:flex-row">
          <p>© {year} {brandName(b)}. All rights reserved.</p>
          <p>Serving Delhi · Gurugram · Noida · Faridabad · Greater Noida</p>
        </div>
      </div>
    </footer>
  );
}
