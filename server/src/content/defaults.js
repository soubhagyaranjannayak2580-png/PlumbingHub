/**
 * Default content seeded on first run. Service descriptions describe the scope of work offered;
 * business facts (phone, address, statistics…) are intentionally left blank so nothing unverified
 * is ever published. Fill them in from Admin → Business Info.
 */

export const SERVICE_AREAS = ['Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Greater Noida'];

export const DEFAULT_SERVICES = [
  {
    slug: 'residential-plumbing',
    title: 'Residential Plumbing',
    icon: 'residential',
    summary: 'End-to-end plumbing for apartments, builder floors, villas and independent homes.',
    description:
      'From a single bathroom upgrade to complete plumbing for a new home, we plan concealed and exposed pipelines, fixtures and water storage so every outlet delivers steady pressure and every drain runs clean. Work is executed to drawings, pressure-tested before handover and documented for future maintenance.',
    features: [
      'Complete home plumbing installation',
      'Bathroom and kitchen plumbing',
      'Water supply systems',
      'Leakage detection and repair',
    ],
  },
  {
    slug: 'commercial-plumbing',
    title: 'Commercial Plumbing',
    icon: 'commercial',
    summary: 'Large-format plumbing for offices, complexes, hotels and restaurants.',
    description:
      'Commercial buildings demand coordinated risers, high-usage washrooms, grease-managed kitchen drainage and minimal downtime. We work alongside architects, MEP consultants and site teams to deliver phased installations that meet schedule and specification.',
    features: [
      'Office buildings',
      'Commercial complexes',
      'Hotels and restaurants',
      'Large-scale plumbing installations',
    ],
  },
  {
    slug: 'industrial-plumbing',
    title: 'Industrial Plumbing',
    icon: 'industrial',
    summary: 'Process and utility pipelines, distribution and drainage for industrial sites.',
    description:
      'Industrial facilities need robust pipework that can be isolated, maintained and expanded. We install utility water distribution, industrial drainage and supporting pipelines with proper supports, valving and testing, and provide planned maintenance to keep plants running.',
    features: [
      'Industrial pipeline installations',
      'Water distribution systems',
      'Industrial drainage',
      'Maintenance and repair',
    ],
  },
  {
    slug: 'bathroom-kitchen-installation',
    title: 'Bathroom & Kitchen Installation',
    icon: 'bathroom',
    summary: 'Sanitary fittings, showers, faucets and complete bathroom & kitchen fit-outs.',
    description:
      'We install sanitaryware and CP fittings with correct concealed-valve depths, floor slopes and trap seals so finished bathrooms and kitchens look premium and perform without leaks or odours.',
    features: [
      'Sanitary fittings and washbasins',
      'Shower installations',
      'Faucets and mixers',
      'Complete bathroom fittings',
    ],
  },
  {
    slug: 'water-supply-systems',
    title: 'Water Supply Systems',
    icon: 'supply',
    summary: 'Underground pipelines, overhead tanks, pumps and distribution networks.',
    description:
      'Reliable water starts with correctly sized storage, pumping and distribution. We install underground mains, sump-to-overhead pumping, pressure systems and building distribution networks designed around actual demand.',
    features: [
      'Underground pipelines',
      'Overhead water tanks',
      'Pump installations',
      'Water distribution networks',
    ],
  },
  {
    slug: 'drainage-sewerage',
    title: 'Drainage & Sewerage',
    icon: 'drainage',
    summary: 'Wastewater, soil and underground drainage with municipal sewer connections.',
    description:
      'Properly graded drainage with accessible inspection chambers prevents blockages and back-flow. We lay soil, waste and underground drainage lines, build chambers and complete sewer connections, and maintain existing networks.',
    features: [
      'Wastewater drainage',
      'Underground drainage',
      'Sewer connections',
      'Drainage maintenance',
    ],
  },
  {
    slug: 'plumbing-maintenance',
    title: 'Plumbing Maintenance',
    icon: 'maintenance',
    summary: 'Leak repair, pipe replacement, blockage removal and preventive maintenance.',
    description:
      'Fast diagnosis and lasting repairs for leaks, low pressure and blockages, plus scheduled preventive maintenance for homes, societies and commercial properties to avoid costly failures.',
    features: [
      'Emergency leakage repair',
      'Pipe replacement',
      'Blockage removal',
      'Preventive maintenance',
    ],
  },
  {
    slug: 'mep-plumbing-solutions',
    title: 'MEP Plumbing Solutions',
    icon: 'mep',
    summary: 'Plumbing design, coordination and project-based execution within MEP scopes.',
    description:
      'For projects that need more than installation, we take plumbing from design through coordination with electrical, HVAC and structure to technical installation and handover, executed as a managed project.',
    features: [
      'Plumbing design and execution',
      'Building plumbing coordination',
      'Technical installation',
      'Project-based execution',
    ],
  },
];

export const DEFAULT_BUSINESS = {
  companyName: 'XYZ',
  legalName: 'XYZ Plumbing & Engineering',
  tagline: 'Plumbing Contractor & Engineering Services',
  phone: '',
  whatsapp: '',
  email: '',
  address: { line1: '', line2: '', city: '', state: '', postalCode: '' },
  mapEmbedQuery: '',
  workingHours: '',
  emergency: { available24x7: false, note: '' },
  serviceAreas: SERVICE_AREAS,
  stats: [
    { key: 'projects', label: 'Completed Projects', value: null, suffix: '+' },
    { key: 'years', label: 'Years of Experience', value: null, suffix: '+' },
    { key: 'clients', label: 'Happy Clients', value: null, suffix: '+' },
    { key: 'locations', label: 'Service Locations', value: null, suffix: '' },
    { key: 'expertise', label: 'Technical Specialisations', value: null, suffix: '' },
  ],
  social: { facebook: '', instagram: '', linkedin: '', youtube: '' },
  notificationEmail: '',
};

export const PROJECT_CATEGORIES = [
  'Residential Projects',
  'Commercial Projects',
  'Industrial Projects',
  'Bathroom Installations',
  'Water Supply Projects',
  'Drainage Projects',
];

export const PROPERTY_TYPES = [
  'Apartment / Flat',
  'Independent House / Villa',
  'Builder Floor',
  'Office',
  'Shop / Showroom',
  'Hotel / Restaurant',
  'Hospital / Institution',
  'Industrial / Factory',
  'Under-construction Site',
  'Other',
];

export const TIME_SLOTS = [
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 3 PM)',
  'Evening (3 PM – 6 PM)',
  'Any time',
];

export const SERVICE_ICONS = ['residential', 'commercial', 'industrial', 'bathroom', 'supply', 'drainage', 'maintenance', 'mep'];
