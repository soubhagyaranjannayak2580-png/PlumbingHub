import { PageTransition } from '../components/layout/PublicLayout';
import { Seo, useLocalBusinessLd } from '../lib/seo';
import ContactSection from '../sections/ContactSection';
import EmergencySection from '../sections/EmergencySection';

export default function ContactPage() {
  const ld = useLocalBusinessLd();
  return (
    <PageTransition>
      <Seo title="Contact Us" description="Contact our plumbing and engineering team for projects, service bookings and quotations across Delhi NCR." jsonLd={ld} />
      <div className="pt-16">
        <ContactSection headingAs="h1" />
      </div>
      <EmergencySection withForm={false} />
    </PageTransition>
  );
}
