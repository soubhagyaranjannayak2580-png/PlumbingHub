import { PageTransition } from '../components/layout/PublicLayout';
import PageHeader from '../components/layout/PageHeader';
import { Seo } from '../lib/seo';
import ServicesGrid from '../sections/ServicesGrid';
import Workflow from '../sections/Workflow';
import CtaBand from '../sections/CtaBand';
import { useSite } from '../lib/site';

export default function ServicesPage() {
  const { data } = useSite();
  const ld = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: data.services.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'Service', name: s.title, description: s.summary, areaServed: 'Delhi NCR', serviceType: s.title },
        })),
      }
    : undefined;
  return (
    <PageTransition>
      <Seo
        title="Plumbing Services in Delhi NCR – Residential, Commercial & Industrial"
        description="Residential, commercial and industrial plumbing, bathroom & kitchen installation, water supply, drainage & sewerage, maintenance and MEP plumbing across Delhi NCR."
        jsonLd={ld}
      />
      <PageHeader
        eyebrow="Services"
        title="Plumbing & engineering services for every building."
        intro="From a single bathroom to a full commercial complex, we plan, install, test and maintain plumbing systems across Delhi, Gurugram, Noida, Faridabad and Greater Noida."
        crumbs={[{ label: 'Services' }]}
      />
      <ServicesGrid />
      <Workflow />
      <CtaBand />
    </PageTransition>
  );
}
