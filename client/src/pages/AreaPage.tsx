import { Link, useParams } from 'react-router-dom';
import { PageTransition } from '../components/layout/PublicLayout';
import PageHeader from '../components/layout/PageHeader';
import { Reveal } from '../components/ui/Reveal';
import ServiceIcon from '../components/ui/ServiceIcon';
import { ArrowIcon, CheckIcon } from '../components/ui/Icons';
import { Seo, useLocalBusinessLd } from '../lib/seo';
import { useSite } from '../lib/site';
import { AREAS } from '../content/areas';
import EnquiryForm from '../forms/EnquiryForm';
import NotFoundPage from './NotFoundPage';

export default function AreaPage() {
  const { city } = useParams();
  const area = AREAS.find((a) => a.slug === city);
  const { data } = useSite();
  const ld = useLocalBusinessLd(area?.name);
  if (!area) return <NotFoundPage />;
  const services = data?.services ?? [];

  return (
    <PageTransition>
      <Seo title={area.metaTitle} description={area.metaDescription} jsonLd={ld} />
      <PageHeader
        eyebrow={`Service Area · ${area.name}${area.altNames ? ` (${area.altNames.join(', ')})` : ''}`}
        title={area.headline}
        intro={area.intro}
        crumbs={[{ label: `Plumbing Contractor in ${area.name}` }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#quote" className="btn-primary">
            Get a free quote in {area.name} <ArrowIcon size={16} />
          </a>
          <Link to="/emergency" className="btn-ghost">
            Emergency help
          </Link>
        </div>
      </PageHeader>

      <section className="bg-mist py-20 text-navy">
        <div className="container-site">
          <h2 className="text-3xl font-bold">Plumbing considerations in {area.name}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {area.considerations.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08} className="card-light p-6">
                <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {area.propertyFocus.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm shadow-sm">
                <CheckIcon size={14} className="text-electric" /> {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-20">
        <div className="container-site">
          <h2 className="text-3xl font-bold">Our plumbing services in {area.name}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link key={s.slug} to={`/services/${s.slug}`} className="group glass rounded-2xl p-5 transition hover:border-electric/50">
                <ServiceIcon icon={s.icon} className="h-10 w-10 text-white" />
                <h3 className="mt-4 font-display font-semibold">
                  {s.title} <span className="sr-only">in {area.name}</span>
                </h3>
                <p className="mt-1 text-sm text-white/60">{s.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="bg-midnight py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">Free quote</span>
            <h2 className="mt-4 text-3xl font-bold">Request plumbing service in {area.name}</h2>
            <p className="mt-4 text-white/65">Tell us about your property and requirement. Our team will contact you to arrange a site inspection.</p>
            <p className="mt-8 text-sm text-white/50">Other areas we serve:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {AREAS.filter((a) => a.slug !== area.slug).map((a) => (
                <li key={a.slug}>
                  <Link to={`/plumbing-contractor/${a.slug}`} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:border-electric hover:text-white">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-3xl p-6 sm:p-8">
            <EnquiryForm variant="booking" defaultLocation={area.name} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
