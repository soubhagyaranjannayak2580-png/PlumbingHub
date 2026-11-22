import EnquiryForm from '../forms/EnquiryForm';
import SectionHeading from '../components/ui/SectionHeading';
import CoverageMap from './CoverageMap';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../components/ui/Icons';
import { formatAddress, telHref, useBusiness, whatsappHref } from '../lib/site';

export default function ContactSection({ headingAs = 'h2' }: { headingAs?: 'h1' | 'h2' }) {
  const b = useBusiness();
  const address = formatAddress(b);
  const mapQuery = b?.mapEmbedQuery || address;

  const items = [
    b?.phone && { icon: <PhoneIcon size={20} />, label: 'Business phone', value: b.phone, href: telHref(b.phone) },
    b?.whatsapp && {
      icon: <WhatsAppIcon size={20} />,
      label: 'WhatsApp',
      value: b.whatsapp,
      href: whatsappHref(b.whatsapp, 'Hello, I would like to enquire about plumbing services.'),
      external: true,
    },
    b?.email && { icon: <MailIcon size={20} />, label: 'Email', value: b.email, href: `mailto:${b.email}` },
    address && { icon: <PinIcon size={20} />, label: 'Office address', value: address },
    b?.workingHours && { icon: <ClockIcon size={20} />, label: 'Working hours', value: b.workingHours },
  ].filter(Boolean) as { icon: JSX.Element; label: string; value: string; href?: string; external?: boolean }[];

  return (
    <section id="contact" className="relative bg-navy py-24 sm:py-32" aria-labelledby="contact-title">
      <div className="container-site">
        <div id="contact-title">
          <SectionHeading
            as={headingAs}
            eyebrow="Contact Us"
            title="Let’s engineer your next project."
            intro="Tell us what you need — a quotation, a site visit or a repair — and our team will respond with the right expertise."
          />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-6">
            {items.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((it) => {
                  const inner = (
                    <>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric/15 text-electric">{it.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-[0.16em] text-white/45">{it.label}</span>
                        <span className="mt-0.5 block break-words text-sm font-medium text-white">{it.value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={it.label}>
                      {it.href ? (
                        <a href={it.href} {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="glass flex h-full gap-3 rounded-2xl p-4 transition hover:border-electric/50">
                          {inner}
                        </a>
                      ) : (
                        <div className="glass flex h-full gap-3 rounded-2xl p-4">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="glass rounded-2xl p-5 text-sm text-white/60">Send us a message using the form and our team will contact you.</div>
            )}

            {mapQuery ? (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <iframe
                  title="Office location on Google Maps"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                  className="h-72 w-full grayscale-[30%] invert-[90%] hue-rotate-180"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
            <CoverageMap />
          </div>

          <div className="glass self-start rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold">Send an enquiry</h3>
            <p className="mt-1 text-sm text-white/60">For service bookings with photos and appointment preferences, use the full request form on the booking page.</p>
            <div className="mt-6">
              <EnquiryForm variant="contact" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
