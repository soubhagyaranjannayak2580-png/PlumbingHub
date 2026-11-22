import { PageTransition } from '../components/layout/PublicLayout';
import { Seo } from '../lib/seo';
import SystemExplorer from '../sections/SystemExplorer';
import CtaBand from '../sections/CtaBand';

export default function SystemPage() {
  return (
    <PageTransition>
      <Seo
        title="Interactive 3D Building Plumbing System"
        description="Explore how water supply, hot water, drainage, overhead tanks and underground drainage work in a building with an interactive 3D plumbing model."
      />
      <div className="pt-16">
        <SystemExplorer headingAs="h1" />
      </div>
      <CtaBand />
    </PageTransition>
  );
}
