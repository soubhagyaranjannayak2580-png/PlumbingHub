import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { brandName, formatAddress, useBusiness } from './site';

interface SeoProps {
  title: string;
  description: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin;

export function Seo({ title, description, noindex, jsonLd }: SeoProps) {
  const business = useBusiness();
  const { pathname } = useLocation();
  const brand = brandName(business);
  const fullTitle = title.includes(brand) ? title : `${title} | ${brand}`;
  const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname.replace(/\/+$/, '')}`;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

/**
 * LocalBusiness (Plumber) structured data built only from verified business settings —
 * address, phone and opening hours are omitted until they are entered in the admin panel.
 */
export function useLocalBusinessLd(areaName?: string) {
  const b = useBusiness();
  if (!b) return undefined;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Plumber',
    name: brandName(b),
    url: SITE_URL,
    description: 'Plumbing contractor and engineering services for residential, commercial and industrial projects in Delhi NCR.',
    areaServed: (areaName ? [areaName] : [...b.serviceAreas, 'Delhi NCR']).map((n) => ({ '@type': 'City', name: n })),
    image: `${SITE_URL}/og-image.svg`,
  };
  if (b.phone) ld.telephone = b.phone;
  if (b.email) ld.email = b.email;
  if (formatAddress(b)) {
    ld.address = {
      '@type': 'PostalAddress',
      streetAddress: [b.address.line1, b.address.line2].filter(Boolean).join(', '),
      addressLocality: b.address.city,
      addressRegion: b.address.state,
      postalCode: b.address.postalCode,
      addressCountry: 'IN',
    };
  }
  const sameAs = Object.values(b.social).filter(Boolean);
  if (sameAs.length) ld.sameAs = sameAs;
  return ld;
}
