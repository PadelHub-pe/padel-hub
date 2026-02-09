/**
 * Facility data mapper
 *
 * Transforms the research JSON (padel_lima_research.json) into
 * typed objects ready for DB insertion.
 */

import { normalizeDistrict } from "./districts";
import { mapAmenities } from "./amenities";
import { mapCoreOfferings } from "./core-offerings";

// ─── Research JSON Types ────────────────────────────────────────────────────

interface ResearchBusiness {
  id: string;
  brand_id: string;
  brand_name: string;
  venue_name: string;
  research_context: string;
  website: string | null;
  image_url: string | null;
  booking_url: string | null;
  google_maps_url: string | null;
  founded_year: number | null;
  location: {
    address: string;
    district: string;
    city: string;
    state_province: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    service_area: string;
  };
  contact: {
    phone: string | null;
    phone_type: string | null;
    secondary_phone: string | null;
    secondary_phone_type: string | null;
    email: string | null;
    social_media: {
      facebook: string | null;
      instagram: string | null;
      linkedin: string | null;
      twitter: string | null;
      tiktok: string | null;
      youtube: string | null;
    };
  };
  facility: {
    unit_label: string;
    total_units: number | null;
    unit_details: Array<{
      name: string;
      type: string;
      surface: string | null;
      size: string | null;
      features: string[];
    }>;
    amenities: string[];
  };
  services: {
    core_offerings: string[];
    specializations: string[];
    differentiators: string[];
  };
  hours: {
    human_readable: string;
    hours_data: Array<{
      day: string;
      open: string;
      close: string;
      is_closed: boolean;
    }>;
  };
  pricing: {
    model: string | null;
    price_range: string | null;
    tiers: Array<{
      label: string;
      price: string;
    }>;
    currency: string;
    source: string | null;
    is_estimated: boolean;
  };
  reviews: {
    google_rating: number | null;
    google_review_count: number | null;
    other_platforms: unknown[];
    sentiment_summary: string | null;
  };
  market_position: {
    estimated_employees: number | null;
    number_of_locations: number | null;
    target_market: string | null;
    market_share_estimate: string | null;
    years_in_market: number | null;
  };
  digital_presence: {
    website_quality: string | null;
    has_online_booking: boolean;
    booking_platform: string | null;
    has_ecommerce: boolean;
    social_media_activity: string | null;
    estimated_monthly_traffic: string | null;
  };
}

interface ResearchJSON {
  report_metadata: unknown;
  global_enums: unknown;
  market_overview: unknown;
  businesses: ResearchBusiness[];
}

// ─── Mapped Output Types ────────────────────────────────────────────────────

export interface MappedFacility {
  name: string;
  slug: string;
  description: string | null;
  address: string;
  district: string;
  city: string;
  phone: string;
  whatsappPhone: string | null;
  email: string | null;
  website: string | null;
  bookingUrl: string | null;
  bookingPlatform: string | null;
  latitude: string | null;
  longitude: string | null;
  googleMapsUrl: string | null;
  googleRating: string | null;
  googleReviewCount: number | null;
  foundedYear: number | null;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  amenities: string[];
  coreOfferings: string[];
  photos: string[];
  isActive: boolean;
  courts: MappedCourt[];
  operatingHours: MappedOperatingHour[];
}

export interface MappedCourt {
  name: string;
  type: "indoor" | "outdoor";
  description: string | null;
  priceInCents: number | null;
  peakPriceInCents: number | null;
}

export interface MappedOperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ─── Mapping Functions ──────────────────────────────────────────────────────

const DAY_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapCourtType(rawType: string): "indoor" | "outdoor" {
  if (rawType === "indoor") return "indoor";
  return "outdoor";
}

function buildSocialMedia(
  sm: ResearchBusiness["contact"]["social_media"],
): MappedFacility["socialMedia"] {
  const result: MappedFacility["socialMedia"] = {};
  if (sm.instagram) result.instagram = sm.instagram;
  if (sm.facebook) result.facebook = sm.facebook;
  if (sm.tiktok) result.tiktok = sm.tiktok;
  if (sm.youtube) result.youtube = sm.youtube;
  return result;
}

function resolvePhone(biz: ResearchBusiness): {
  phone: string;
  whatsappPhone: string | null;
} {
  const primary = biz.contact.phone?.replace(/\s/g, "") ?? null;
  const secondary = biz.contact.secondary_phone?.replace(/\s/g, "") ?? null;

  // Determine whatsapp number
  let whatsappPhone: string | null = null;
  if (biz.contact.phone_type === "whatsapp" || biz.contact.phone_type === "both") {
    whatsappPhone = primary;
  }
  if (
    biz.contact.secondary_phone_type === "whatsapp" ||
    biz.contact.secondary_phone_type === "both"
  ) {
    whatsappPhone = whatsappPhone ?? secondary;
  }

  // Use primary phone, fallback to secondary, fallback to placeholder
  const phone = primary ?? secondary ?? "+51000000000";

  return { phone, whatsappPhone };
}

function buildDescription(biz: ResearchBusiness): string {
  const parts: string[] = [];

  // Use specializations and differentiators to build a description
  if (biz.services.specializations.length > 0) {
    parts.push(biz.services.specializations.join(". ") + ".");
  }
  if (biz.services.differentiators.length > 0) {
    parts.push(biz.services.differentiators.join(". ") + ".");
  }

  // Add basic info
  const courtCount = biz.facility.total_units;
  const district = biz.location.district;
  if (courtCount) {
    parts.unshift(
      `${biz.venue_name} cuenta con ${courtCount} canchas de pádel en ${district}.`,
    );
  } else {
    parts.unshift(`${biz.venue_name} - Centro de pádel en ${district}.`);
  }

  return parts.join(" ");
}

function mapOperatingHours(
  hoursData: ResearchBusiness["hours"]["hours_data"],
): MappedOperatingHour[] {
  return hoursData
    .map((h) => {
      const dayOfWeek = DAY_TO_NUMBER[h.day];
      if (dayOfWeek === undefined) return null;

      return {
        dayOfWeek,
        openTime: h.open,
        closeTime: h.close,
        isClosed: h.is_closed,
      };
    })
    .filter((h): h is MappedOperatingHour => h !== null);
}

function mapCourts(
  unitDetails: ResearchBusiness["facility"]["unit_details"],
): MappedCourt[] {
  return unitDetails.map((unit) => {
    // Build description from surface and features
    const descParts: string[] = [];
    if (unit.surface) descParts.push(`Superficie: ${unit.surface}`);
    if (unit.size) descParts.push(`Tamaño: ${unit.size}`);
    if (unit.features.length > 0) descParts.push(unit.features.join(", "));

    return {
      name: unit.name,
      type: mapCourtType(unit.type),
      description: descParts.length > 0 ? descParts.join(". ") : null,
      priceInCents: null, // Will be populated if pricing data is available
      peakPriceInCents: null,
    };
  });
}

/**
 * Estimate pricing from the pricing tiers data.
 * Returns { base, peak } in cents, or null if no data.
 */
function estimatePricing(biz: ResearchBusiness): {
  base: number | null;
  peak: number | null;
} {
  if (biz.pricing.tiers.length === 0) return { base: null, peak: null };

  // Try to extract numbers from tier prices
  const prices: number[] = [];
  for (const tier of biz.pricing.tiers) {
    if (typeof tier === "string" || !tier.price) continue;
    const match = tier.price.match(/(\d+)/);
    if (match?.[1]) {
      prices.push(parseInt(match[1], 10));
    }
  }

  if (prices.length === 0) return { base: null, peak: null };

  const sorted = prices.sort((a, b) => a - b);
  const base = sorted[0] ?? null;
  const peak = sorted.length > 1 ? (sorted[sorted.length - 1] ?? null) : base;

  // Convert soles to cents
  return {
    base: base ? base * 100 : null,
    peak: peak ? peak * 100 : null,
  };
}

// ─── Main Mapper ────────────────────────────────────────────────────────────

/**
 * Transform the full research JSON into an array of mapped facilities
 * ready for DB insertion.
 */
export function mapResearchToFacilities(
  json: ResearchJSON,
): MappedFacility[] {
  return json.businesses.map((biz) => {
    const { phone, whatsappPhone } = resolvePhone(biz);
    const pricing = estimatePricing(biz);
    const courts = mapCourts(biz.facility.unit_details);

    // Apply pricing to courts if available
    if (pricing.base !== null) {
      for (const court of courts) {
        court.priceInCents = pricing.base;
        court.peakPriceInCents = pricing.peak;
      }
    }

    return {
      name: biz.venue_name,
      slug: slugify(biz.venue_name),
      description: buildDescription(biz),
      address: biz.location.address,
      district: normalizeDistrict(biz.location.district),
      city: biz.location.city || "Lima",
      phone,
      whatsappPhone,
      email: biz.contact.email ?? null,
      website: biz.website ?? null,
      bookingUrl: biz.booking_url ?? null,
      bookingPlatform: biz.digital_presence.booking_platform ?? null,
      latitude: biz.location.latitude?.toString() ?? null,
      longitude: biz.location.longitude?.toString() ?? null,
      googleMapsUrl: biz.google_maps_url ?? null,
      googleRating: biz.reviews.google_rating?.toString() ?? null,
      googleReviewCount: biz.reviews.google_review_count ?? null,
      foundedYear: biz.founded_year ?? null,
      socialMedia: buildSocialMedia(biz.contact.social_media),
      amenities: mapAmenities(biz.facility.amenities),
      coreOfferings: mapCoreOfferings(biz.services.core_offerings),
      photos: biz.image_url ? [biz.image_url] : [],
      isActive: true,
      courts,
      operatingHours: mapOperatingHours(biz.hours.hours_data),
    };
  });
}
