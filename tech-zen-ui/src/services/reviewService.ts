import { apiCall } from './api';
import type {
  ReviewResponse,
  ApiResponse,
  PagedResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types';

/**
 * Helper để biến object params thành query string
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const reviewService = {
  /**
   * GET /reviews/products/{productId}
   */
  async getReviewsByProduct(
    productId: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PagedResponse<ReviewResponse>>> {
    const queryString = buildQueryString({ page, size });
    return apiCall('GET', `/reviews/products/${productId}${queryString}`);
  },
  
  /**
   * POST /reviews/products/{productId}
   * GIẢ ĐỊNH BE ĐÃ SỬA thành @RequestPart("request") và @RequestPart("attachments")
   */
  async createReview(
    productId: string,
    request: CreateReviewRequest,
    attachments?: File[]
  ): Promise<ApiResponse<ReviewResponse>> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }
    return apiCall('POST', `/reviews/products/${productId}`, formData);
  },
  
  /**
   * PUT /reviews/{id}
   */
  async updateReview(reviewId: number, request: UpdateReviewRequest): Promise<ApiResponse<ReviewResponse>> {
    return apiCall('PUT', `/reviews/${reviewId}`, request);
  },
  
  /**
   * DELETE /reviews/{id}
   */
  async deleteReview(reviewId: number): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/reviews/${reviewId}`);
  },
};