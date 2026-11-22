import { PageTransition } from '../components/layout/PublicLayout';
import { Seo } from '../lib/seo';
import EmergencySection from '../sections/EmergencySection';

export default function EmergencyPage() {
  return (
    <PageTransition>
      <Seo
        title="Emergency Plumbing Help in Delhi NCR"
        description="Burst pipe, major leak, sewer overflow or no water? Call, WhatsApp or request immediate plumbing assistance in Delhi, Gurugram, Noida, Faridabad and Greater Noida."
      />
      <div className="pt-16">
        <EmergencySection headingAs="h1" />
      </div>
    </PageTransition>
  );
}
