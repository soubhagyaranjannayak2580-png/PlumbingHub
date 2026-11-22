import { PageTransition } from '../components/layout/PublicLayout';
import { Seo } from '../lib/seo';
import ProjectsShowcase from '../sections/ProjectsShowcase';
import Testimonials from '../sections/Testimonials';
import CtaBand from '../sections/CtaBand';

export default function ProjectsPage() {
  return (
    <PageTransition>
      <Seo
        title="Plumbing Projects Portfolio – Delhi NCR"
        description="Residential, commercial, industrial, bathroom, water supply and drainage plumbing projects delivered across Delhi, Gurugram, Noida, Faridabad and Greater Noida."
      />
      <div className="pt-16">
        <ProjectsShowcase headingAs="h1" />
      </div>
      <Testimonials />
      <CtaBand />
    </PageTransition>
  );
}
