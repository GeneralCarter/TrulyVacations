
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
  limit_page_url?: string; // Not explicitly in example, but good practice if available
  next_page_url?: string;
  offset: number;
}

export class OwnerRezApi {
  private username: string;
  private token: string;
  private baseUrl = "https://api.ownerrez.com/v2";

  constructor() {
    // Support both Astro import.meta.env and Node process.env
    this.username = import.meta.env.OWNERREZ_USERNAME || process.env.OWNERREZ_USERNAME || "";
    this.token = import.meta.env.OWNERREZ_PASSWORD || process.env.OWNERREZ_PASSWORD || "";

    if (!this.username || !this.token) {
      console.warn("OwnerRez credentials (OWNERREZ_USERNAME, OWNERREZ_PASSWORD) not found in environment variables.");
    }
  }

  private getAuthHeader(): string {
    // Basic Auth: base64(username:password)
    // Buffer.from is stable in Node, btoa is web standard. Using Buffer for Node.js compat if needed, 
    // but in Astro 'btoa' or 'Buffer' depends on runtime (Edge vs Node).
    // Let's use Buffer if available (Node), else btoa (Browser/Edge).
    if (typeof Buffer !== 'undefined') {
      return `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`;
    } else {
      return `Basic ${btoa(`${this.username}:${this.token}`)}`;
    }
  }

  async getListings(includeAllDetails: boolean = false): Promise<OwnerRezListingsResponse> {
    const includeAllDetailsParam = includeAllDetails ? "?includeAmenities=true&includeImages=true&includeBathrooms=true&includeDescriptions=text&includeRooms=true" : "";
    const url = `${this.baseUrl}/listings${includeAllDetailsParam}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`OwnerRez API Request Failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OwnerRezListingsResponse;
      return data;
    } catch (error) {
      console.error("Error fetching listings from OwnerRez:", error);
      throw error;
    }
  }
}

// Export a singleton instance for convenience
export const ownerRez = new OwnerRezApi();
