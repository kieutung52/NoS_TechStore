export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string; 
    city_district?: string; 
    city?: string; 
    country: string;
    postcode?: string;
  };
}

export const mapService = {
  /**
   * Tìm kiếm địa chỉ/địa danh
   * @param query Ví dụ: "Aeon Mall Hà Đông"
   */
  async searchAddress(query: string): Promise<NominatimResult[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }
    
    
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'vn',
      viewbox: '102.144,8.179,109.468,23.393', 
      bounded: '1'
    });

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Nominatim search failed');
      }
      const data: NominatimResult[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching from Nominatim:", error);
      return [];
    }
  }
};