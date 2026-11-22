import { useSearchParams } from 'react-router-dom';
import { PageTransition } from '../components/layout/PublicLayout';
import PageHeader from '../components/layout/PageHeader';
import { Seo } from '../lib/seo';
import EnquiryForm from '../forms/EnquiryForm';
import { ClockIcon, PhoneIcon, WhatsAppIcon } from '../components/ui/Icons';
import { telHref, useBusiness, whatsappHref } from '../lib/site';

const NEXT = [
  'You receive a unique reference number instantly.',
  'Our team reviews your request and photos.',
  'We call to confirm details and schedule a site inspection.',
  'You receive a transparent quotation for approval.',
];

export default function BookPage() {
  const b = useBusiness();
  const [params] = useSearchParams();
  return (
    <PageTransition>
      <Seo
        title="Book a Plumber / Request a Free Quote"
        description="Request plumbing service or a project quotation in Delhi, Gurugram, Noida, Faridabad and Greater Noida. Upload photos and choose a preferred appointment time."
      />
      <PageHeader
        eyebrow="Service Request"
        title="Request a free quote or book a service."
        intro="Share your requirement and photos. You’ll get a reference number immediately and our team will be in touch."
        crumbs={[{ label: 'Book a Service' }]}
      />
      <section className="bg-navy pb-24">
        <div className="container-site grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="glass rounded-3xl p-6 sm:p-10">
            <EnquiryForm variant="booking" defaultService={params.get('service') ?? ''} defaultLocation={params.get('location') ?? ''} />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="glass rounded-3xl p-6">
              <h2 className="font-display text-lg font-bold">What happens next</h2>
              <ol className="mt-4 space-y-4">
                {NEXT.map((n, i) => (
                  <li key={n} className="flex gap-3 text-sm text-white/75">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-electric/15 font-display text-xs font-bold text-electric">{i + 1}</span>
                    {n}
                  </li>
                ))}
              </ol>
            </div>
            {(b?.phone || b?.whatsapp) && (
              <div className="glass rounded-3xl p-6">
                <h2 className="font-display text-lg font-bold">Prefer to talk?</h2>
                <div className="mt-4 flex flex-col gap-3">
                  {b.phone && (
                    <a href={telHref(b.phone)} className="btn-primary">
                      <PhoneIcon size={18} /> Call {b.phone}
                    </a>
                  )}
                  {b.whatsapp && (
                    <a href={whatsappHref(b.whatsapp, 'Hello, I would like to book a plumbing service.')} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white">
                      <WhatsAppIcon size={18} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
            {b?.workingHours && (
              <p className="flex items-center gap-2 px-2 text-sm text-white/55">
                <ClockIcon size={16} /> {b.workingHours}
              </p>
            )}
          </aside>
        </div>
      </section>
    </PageTransition>
  );
}
