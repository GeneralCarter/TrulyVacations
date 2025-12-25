import type { OwnerRezListingsResponse, OwnerRezProperty } from "./ownerRezTypes";

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

  async getProperty(id: number): Promise<OwnerRezProperty> {
    const url = `${this.baseUrl}/properties/${id}`;

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

      const data = await response.json() as OwnerRezProperty;
      return data;
    } catch (error) {
      console.error(`Error fetching property ${id} from OwnerRez:`, error);
      throw error;
    }
  }
}

// Export a singleton instance for convenience
export const ownerRez = new OwnerRezApi();
