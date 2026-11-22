/** Convert snake_case DB rows into the camelCase shapes used by the API. */

export const mapService = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  description: r.description,
  features: r.features ?? [],
  icon: r.icon,
  sort: r.sort,
  published: r.published,
});

export const mapProject = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  location: r.location,
  category: r.category,
  description: r.description,
  scope: r.scope ?? [],
  images: r.images ?? [],
  beforeImage: r.before_image ?? null,
  afterImage: r.after_image ?? null,
  completedOn: r.completed_on ?? '',
  featured: r.featured,
  published: r.published,
  sort: r.sort,
});

export const mapTestimonial = (r, { includeUnverifiedRating = false } = {}) => ({
  id: r.id,
  name: r.name,
  projectType: r.project_type,
  location: r.location,
  feedback: r.feedback,
  // Ratings are only shown publicly when they have been verified.
  rating: includeUnverifiedRating || r.rating_verified ? r.rating : null,
  ratingVerified: r.rating_verified,
  published: r.published,
  sort: r.sort,
});

export const mapEnquiry = (r) => ({
  id: r.id,
  reference: r.reference,
  kind: r.kind,
  fullName: r.full_name,
  mobile: r.mobile,
  email: r.email,
  location: r.location,
  address: r.address,
  propertyType: r.property_type,
  service: r.service,
  description: r.description,
  preferredDate: r.preferred_date,
  preferredTime: r.preferred_time,
  urgency: r.urgency,
  status: r.status,
  technicianId: r.technician_id,
  technicianName: r.technician_name ?? null,
  scheduledDate: r.scheduled_date,
  scheduledTime: r.scheduled_time,
  emailNotified: r.email_notified,
  imageCount: r.image_count != null ? Number(r.image_count) : undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
