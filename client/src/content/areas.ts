export interface Area {
  slug: string;
  name: string;
  altNames?: string[];
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  considerations: { title: string; body: string }[];
  propertyFocus: string[];
}

/**
 * Local service-area landing pages. Content describes the work offered and typical local
 * plumbing considerations – no fabricated addresses, project counts or reviews.
 */
export const AREAS: Area[] = [
  {
    slug: 'delhi',
    name: 'Delhi',
    metaTitle: 'Plumbing Contractor in Delhi',
    metaDescription:
      'Plumbing contractor in Delhi for homes, offices, hotels and industrial units – installation, drainage, water supply and maintenance. Request a free quote.',
    headline: 'Plumbing Contractor in Delhi',
    intro:
      'From re-plumbing older independent houses to complete installations in new builder floors, commercial buildings and hospitality projects, we deliver engineered plumbing across Delhi with clean execution and proper testing.',
    considerations: [
      { title: 'Ageing pipework', body: 'Many older Delhi properties still run on corroded GI lines. We plan phased replacement with CPVC/PPR to restore pressure and stop hidden leaks.' },
      { title: 'Storage & pumping', body: 'Intermittent municipal supply makes underground sumps, overhead tanks and correctly sized pumps essential. We design storage around real demand.' },
      { title: 'Drainage upgrades', body: 'Additional floors and bathrooms often overload old drainage. We re-grade lines, add inspection chambers and upgrade stacks to prevent back-flow.' },
    ],
    propertyFocus: ['Independent houses & builder floors', 'Offices & showrooms', 'Hotels, restaurants & hospitals', 'Industrial units'],
  },
  {
    slug: 'gurugram',
    name: 'Gurugram',
    altNames: ['Gurgaon'],
    metaTitle: 'Plumbing Contractor in Gurgaon (Gurugram)',
    metaDescription:
      'Residential and commercial plumbing services in Gurugram / Gurgaon – complete installations, bathroom fit-outs, drainage and water supply systems.',
    headline: 'Plumbing Contractor in Gurugram (Gurgaon)',
    intro:
      'Premium apartments, villas, corporate offices and high-rise commercial towers in Gurugram need plumbing that matches their finish. We execute complete installations, bathroom fit-outs and building services coordination to specification.',
    considerations: [
      { title: 'Hard water', body: 'High-TDS groundwater accelerates scaling in fittings, geysers and mixers. We recommend filtration/softening provisions and scale-resistant pipe materials.' },
      { title: 'High-rise pressure zoning', body: 'Tall buildings need pressure-reducing valves and zoned risers so upper and lower floors get balanced, safe pressure.' },
      { title: 'Premium fit-outs', body: 'Concealed cisterns, thermostatic mixers and rain showers need exact rough-in depths and testing before tiling.' },
    ],
    propertyFocus: ['Apartments & villas', 'Corporate offices', 'Commercial complexes', 'Hotels & restaurants'],
  },
  {
    slug: 'noida',
    name: 'Noida',
    metaTitle: 'Plumbing Contractor in Noida',
    metaDescription: 'Plumbing installation, repair and maintenance for apartments, offices and industrial units in Noida.',
    headline: 'Plumbing Contractor in Noida',
    intro:
      'Noida’s residential societies, IT offices and industrial sectors rely on dependable water supply and drainage. We handle new installations, upgrades and planned maintenance with minimal disruption.',
    considerations: [
      { title: 'Society-scale systems', body: 'Shared sumps, booster pumps and common drainage need coordinated maintenance. We support RWAs and facility teams with scheduled upkeep.' },
      { title: 'Apartment renovations', body: 'Bathroom and kitchen upgrades in occupied towers require careful isolation and leak-free tie-ins to shared shafts.' },
      { title: 'Industrial utilities', body: 'Factory units need robust water distribution and industrial drainage that can be isolated and serviced.' },
    ],
    propertyFocus: ['Residential societies', 'IT & office buildings', 'Industrial units', 'Retail & hospitality'],
  },
  {
    slug: 'faridabad',
    name: 'Faridabad',
    metaTitle: 'Plumbing Contractor in Faridabad',
    metaDescription: 'Industrial, commercial and residential plumbing contractor serving Faridabad – pipelines, drainage and water supply.',
    headline: 'Plumbing Contractor in Faridabad',
    intro:
      'With a strong industrial base alongside growing residential sectors, Faridabad projects range from factory pipelines to complete home plumbing. We bring engineering discipline to both.',
    considerations: [
      { title: 'Industrial pipelines', body: 'Correct supports, valving and testing keep utility pipelines safe and maintainable for plant operations.' },
      { title: 'Drainage capacity', body: 'Industrial and residential drainage must be sized and graded properly to avoid overflows during peak flows and monsoon.' },
      { title: 'Water storage', body: 'Reliable sump-and-overhead systems with properly selected pumps keep supply consistent.' },
    ],
    propertyFocus: ['Factories & warehouses', 'Independent houses', 'Commercial buildings', 'Institutional buildings'],
  },
  {
    slug: 'greater-noida',
    name: 'Greater Noida',
    metaTitle: 'Plumbing Contractor in Greater Noida',
    metaDescription: 'Plumbing contractor for residential societies, villas, commercial and industrial projects in Greater Noida.',
    headline: 'Plumbing Contractor in Greater Noida',
    intro:
      'New-build societies, villas, institutions and industrial parks in Greater Noida need plumbing that is planned right from the first drawing. We execute complete systems and handle maintenance.',
    considerations: [
      { title: 'New construction', body: 'We coordinate sleeves, shafts and slab cut-outs with site teams early, preventing costly rework later.' },
      { title: 'Institutional buildings', body: 'Schools, hostels and hospitals require durable fixtures and high-capacity washroom plumbing.' },
      { title: 'Planned maintenance', body: 'Scheduled inspection of pumps, tanks and drainage avoids emergency breakdowns.' },
    ],
    propertyFocus: ['Villas & societies', 'Institutions', 'Industrial parks', 'Commercial projects'],
  },
];
