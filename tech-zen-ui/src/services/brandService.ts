import { apiCall } from './api';
import type {
  BrandResponse,
  ApiResponse,
  CreateBrandRequest,
  UpdateBrandRequest,
} from '../types';

export const brandService = {
  /**
   * GET /brands
   */
  async getAllBrands(): Promise<ApiResponse<BrandResponse[]>> {
    return apiCall('GET', '/brands');
  },
  
  /**
   * GET /brands/{id}
   */
  async getBrandById(id: number): Promise<ApiResponse<BrandResponse>> {
    return apiCall('GET', `/brands/${id}`);
  },

  /**
   * POST /brands
   * GIẢ ĐỊNH BE ĐÃ SỬA thành @RequestPart("request") và @RequestPart("logo")
   */
  async createBrand(request: CreateBrandRequest, logoFile?: File): Promise<ApiResponse<BrandResponse>> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return apiCall('POST', '/brands', formData);
  },

  /**
   * PUT /brands/{id}
   * Tương tự như trên
   */
  async updateBrand(id: number, request: UpdateBrandRequest, logoFile?: File): Promise<ApiResponse<BrandResponse>> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return apiCall('PUT', `/brands/${id}`, formData);
  },

  /**
   * DELETE /brands/{id}
   */
  async deleteBrand(id: number): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/brands/${id}`);
  },
};