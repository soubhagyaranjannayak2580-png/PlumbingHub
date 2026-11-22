import { Link, useParams } from 'react-router-dom';
import { PageTransition } from '../components/layout/PublicLayout';
import PageHeader from '../components/layout/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import ServiceIcon from '../components/ui/ServiceIcon';
import { Reveal } from '../components/ui/Reveal';
import { ArrowIcon, CheckIcon } from '../components/ui/Icons';
import { Seo } from '../lib/seo';
import { brandName, useSite } from '../lib/site';
import EnquiryForm from '../forms/EnquiryForm';
import { AREAS } from '../content/areas';
import NotFoundPage from './NotFoundPage';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { data, loading } = useSite();
  if (loading && !data) return <PageLoader />;
  const s = data?.services.find((x) => x.slug === slug);
  if (!s) return <NotFoundPage />;
  const others = (data?.services ?? []).filter((x) => x.slug !== s.slug).slice(0, 4);

  return (
    <PageTransition>
      <Seo
        title={`${s.title} in Delhi NCR`}
        description={`${s.summary} Serving Delhi, Gurugram, Noida, Faridabad and Greater Noida.`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: s.title,
          description: s.description,
          serviceType: s.title,
          provider: { '@type': 'Plumber', name: brandName(data?.business ?? null) },
          areaServed: AREAS.map((a) => ({ '@type': 'City', name: a.name })),
        }}
      />
      <PageHeader eyebrow="Service" title={s.title} intro={s.summary} crumbs={[{ to: '/services', label: 'Services' }, { label: s.title }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#request" className="btn-primary">
            Request this service <ArrowIcon size={16} />
          </a>
          <Link to="/system" className="btn-ghost">
            Explore the 3D system
          </Link>
        </div>
      </PageHeader>

      <section className="bg-mist py-20 text-navy">
        <div className="container-site grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-navy text-white">
              <ServiceIcon icon={s.icon} className="h-12 w-12" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Overview</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">{s.description}</p>
          </Reveal>
          <Reveal delay={0.1} className="card-light p-8">
            <h2 className="text-xl font-bold">What’s included</h2>
            <ul className="mt-5 space-y-3">
              {s.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-electric/10 text-electric">
                    <CheckIcon size={14} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-500">
              Available in {AREAS.map((a, i) => (
                <span key={a.slug}>
                  <Link className="text-electric hover:underline" to={`/plumbing-contractor/${a.slug}`}>
                    {a.name}
                  </Link>
                  {i < AREAS.length - 1 ? ', ' : ''}
                </span>
              ))}{' '}
              and across Delhi NCR.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="request" className="bg-navy py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">Request a quote</span>
            <h2 className="mt-4 text-3xl font-bold">Tell us about your {s.title.toLowerCase()} requirement</h2>
            <p className="mt-4 text-white/65">Share details and photos — our team will review and contact you to schedule a site inspection.</p>
            {others.length > 0 && (
              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Related services</p>
                <ul className="mt-4 space-y-2">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link to={`/services/${o.slug}`} className="group flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 hover:border-electric">
                        {o.title} <ArrowIcon size={16} className="text-electric transition group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="glass rounded-3xl p-6 sm:p-8">
            <EnquiryForm variant="booking" defaultService={s.title} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
