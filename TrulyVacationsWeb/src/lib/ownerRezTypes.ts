
export interface OwnerRezAmenity {
  icon: string;
  text: string;
  title: string;
}

export interface OwnerRezAmenityCategory {
  amenities: OwnerRezAmenity[];
  caption: string;
  type: string;
}

export interface OwnerRezBathroom {
  description: string;
  name: string;
  type: string;
}

export interface OwnerRezDescriptions {
  accommodations_detail: string;
  accommodations_summary: string;
  description: string;
  features_description: string;
  getting_around: string;
  getting_there: string;
  guest_access: string;
  headline: string;
  location_description: string;
  location_other_activities: string;
  owner_listing_story: string;
  rate_notes: string;
  short_description: string;
  unique_benefits: string;
  why_purchased: string;
  year_purchased: string;
}

export interface OwnerRezRoom {
  description: string;
  name: string;
  total_beds: number;
  type: string;
}

export interface PhotoMetadata {
  caption: string;
  cropped_url: string;
  large_url: string;
  original_url: string;
  video_url?: string;
}

export interface OwnerRezListing {
  amenity_call_outs: OwnerRezAmenity[];
  amenity_categories: OwnerRezAmenityCategory[];
  bathroom_count: number;
  bathroom_full_count: number;
  bathroom_half_count: number;
  bathrooms: OwnerRezBathroom[];
  bedroom_count: number;
  cancellation_policy: string;
  check_in_instructions: string;
  descriptions: OwnerRezDescriptions;
  directions: string;
  house_manual: string;
  internet_info: string;
  location_types: string[];
  nightly_rate_max: number;
  nightly_rate_min: number;
  occupancy_max: number;
  occupancy_min: number;
  photos: PhotoMetadata[];
  property_id: number;
  property_space_type: string;
  registration_date: string;
  registration_number: string;
  review_average: number;
  review_count: number;
  rooms: OwnerRezRoom[];
  sleeps_in_beds_count: number;
  sleeps_max: number;
  sleeps_min: number;
  wifi_network?: string;
  wifi_password?: string;
}

export interface OwnerRezListingsResponse {
  items: OwnerRezListing[];
  limit: number;
  limit_page_url?: string;
  next_page_url?: string;
  offset: number;
}

export interface OwnerRezAddress {
  city: string;
  country: string;
  id: number;
  is_default: boolean;
  postal_code: string;
  province: string;
  state: string;
  street1: string;
  street2: string;
  type: string;
}

export interface OwnerRezProperty {
  active: boolean;
  address: OwnerRezAddress;
  bathrooms: number;
  bathrooms_full: number;
  bathrooms_half: number;
  bedrooms: number;
  check_in: string;
  check_in_end: string;
  check_out: string;
  currency_code: string;
  display_order: number;
  external_display_order: number;
  external_name: string;
  id: number;
  internal_code: string;
  is_snoozed: boolean;
  key: string;
  latitude: number;
  listing_numbers: Record<string, string>;
  living_area: number;
  living_area_type: string;
  longitude: number;
  max_adults: number;
  max_children: number;
  max_guests: number;
  max_pets: number;
  name: string;
  owner_id: number;
  property_type: string;
  public_url: string;
  thumbnail_url: string;
  thumbnail_url_large: string;
  thumbnail_url_medium: string;
  time_zone: string;
}
