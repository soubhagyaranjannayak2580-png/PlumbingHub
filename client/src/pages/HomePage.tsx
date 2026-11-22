import { PageTransition } from '../components/layout/PublicLayout';
import { Seo, useLocalBusinessLd } from '../lib/seo';
import Hero from '../sections/Hero';
import ServicesGrid from '../sections/ServicesGrid';
import SystemExplorer from '../sections/SystemExplorer';
import WhyChooseUs from '../sections/WhyChooseUs';
import Workflow from '../sections/Workflow';
import ProjectsShowcase from '../sections/ProjectsShowcase';
import Testimonials from '../sections/Testimonials';
import EmergencySection from '../sections/EmergencySection';
import ContactSection from '../sections/ContactSection';
import CtaBand from '../sections/CtaBand';

export default function HomePage() {
  const ld = useLocalBusinessLd();
  return (
    <PageTransition>
      <Seo
        title="Plumbing Contractor in Delhi NCR – Residential, Commercial & Industrial"
        description="Professional plumbing contractor for residential, commercial and industrial projects across Delhi, Gurugram, Noida, Faridabad and Greater Noida. Request a free quote."
        jsonLd={ld}
      />
      <Hero />
      <ServicesGrid />
      <SystemExplorer />
      <WhyChooseUs />
      <Workflow />
      <ProjectsShowcase limit={3} />
      <Testimonials />
      <EmergencySection withForm={false} />
      <ContactSection />
      <CtaBand />
    </PageTransition>
  );
}
