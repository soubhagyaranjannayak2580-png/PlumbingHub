export type ServiceIcon = 'residential' | 'commercial' | 'industrial' | 'bathroom' | 'supply' | 'drainage' | 'maintenance' | 'mep';

export interface Service {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  features: string[];
  icon: ServiceIcon;
  sort: number;
  published: boolean;
}

export interface ImageRef {
  src: string;
  thumb?: string;
  alt: string;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  location: string;
  category: string;
  description: string;
  scope: string[];
  images: ImageRef[];
  beforeImage: ImageRef | null;
  afterImage: ImageRef | null;
  completedOn: string;
  featured: boolean;
  published: boolean;
  sort: number;
}

export interface Testimonial {
  id: number;
  name: string;
  projectType: string;
  location: string;
  feedback: string;
  rating: number | null;
  ratingVerified: boolean;
  published: boolean;
  sort: number;
}

export interface Stat {
  key: string;
  label: string;
  value: number | null;
  suffix: string;
}

export interface Business {
  companyName: string;
  legalName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: { line1: string; line2: string; city: string; state: string; postalCode: string };
  mapEmbedQuery: string;
  workingHours: string;
  emergency: { available24x7: boolean; note: string };
  serviceAreas: string[];
  stats: Stat[];
  social: { facebook: string; instagram: string; linkedin: string; youtube: string };
  notificationEmail?: string;
}

export interface SiteData {
  business: Business;
  services: Service[];
  testimonials: Testimonial[];
  projects: Project[];
  options: { propertyTypes: string[]; timeSlots: string[]; projectCategories: string[] };
}

export type EnquiryStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';
export type Urgency = 'emergency' | 'urgent' | 'normal';
export type EnquiryKind = 'booking' | 'emergency' | 'contact';

export interface Enquiry {
  id: number;
  reference: string;
  kind: EnquiryKind;
  fullName: string;
  mobile: string;
  email: string | null;
  location: string | null;
  address: string | null;
  propertyType: string | null;
  service: string | null;
  description: string;
  preferredDate: string | null;
  preferredTime: string | null;
  urgency: Urgency;
  status: EnquiryStatus;
  technicianId: number | null;
  technicianName: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  emailNotified: boolean;
  imageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  specialization: string;
  active: boolean;
  openJobs?: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  active?: boolean;
  lastLoginAt?: string | null;
}
