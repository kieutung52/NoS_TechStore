import { apiCall } from './api';
import type {
  CartResponse,
  ApiResponse,
  AddCartItemRequest,
  UpdateCartItemRequest
} from '../types';

export const cartService = {
  /**
   * GET /carts
   */
  async getCart(): Promise<ApiResponse<CartResponse>> {
    return apiCall('GET', '/carts');
  },

  /**
   * POST /carts/items
   */
  async addItem(request: AddCartItemRequest): Promise<ApiResponse<CartResponse>> {
    return apiCall('POST', '/carts/items', request);
  },

  /**
   * PUT /carts/items/{variantId}
   */
  async updateItem(
    variantId: string,
    request: UpdateCartItemRequest
  ): Promise<ApiResponse<CartResponse>> {
   
    return apiCall('PUT', `/carts/items/${variantId}`, request);
  },

  /**
   * DELETE /carts/items/{variantId}
   */
  async removeItem(variantId: string): Promise<ApiResponse<null>> {
   
    return apiCall('DELETE', `/carts/items/${variantId}`);
  },

  /**
   * DELETE /carts/clear
   */
  async clearCart(): Promise<ApiResponse<null>> {
    return apiCall('DELETE', '/carts/clear');
  }
};