import { apiCall } from './api';
import type {
  AddressResponse,
  ApiResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../types';

export const addressService = {
  /**
   * GET /addresses
   */
  async getAddresses(): Promise<ApiResponse<AddressResponse[]>> {
    return apiCall('GET', '/addresses');
  },

  /**
   * GET /addresses/{id}
   */
  async getAddressById(id: number): Promise<ApiResponse<AddressResponse>> {
    return apiCall('GET', `/addresses/${id}`);
  },

  /**
   * POST /addresses
   */
  async createAddress(request: CreateAddressRequest): Promise<ApiResponse<AddressResponse>> {
    return apiCall('POST', '/addresses', request);
  },

  /**
   * PUT /addresses/{id}
   */
  async updateAddress(id: number, request: UpdateAddressRequest): Promise<ApiResponse<AddressResponse>> {
    return apiCall('PUT', `/addresses/${id}`, request);
  },

  /**
   * PUT /addresses/{id}/set-default
   */
  async setDefaultAddress(id: number): Promise<ApiResponse<null>> {
    return apiCall('PUT', `/addresses/${id}/set-default`, {});
  },

  /**
   * DELETE /addresses/{id}
   */
  async deleteAddress(id: number): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/addresses/${id}`);
  }
};