import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageTransition } from '../components/layout/PublicLayout';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <Helmet>
        <title>Page not found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="container-site flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <p className="font-display text-8xl font-extrabold text-gradient">404</p>
        <h1 className="mt-4 text-3xl font-bold">This pipe leads nowhere.</h1>
        <p className="mt-3 text-white/60">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-8 flex gap-3">
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
          <Link to="/contact" className="btn-ghost">
            Contact us
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
