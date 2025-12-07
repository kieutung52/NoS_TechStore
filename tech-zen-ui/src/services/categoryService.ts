import { apiCall } from './api';
import type {
  CategoryResponse,
  ApiResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types';

export const categoryService = {
  /**
   * GET /categories
   */
  async getAllCategories(): Promise<ApiResponse<CategoryResponse[]>> {
    return apiCall('GET', '/categories');
  },
  
  /**
   * GET /categories/{id}
   */
  async getCategoryById(id: number): Promise<ApiResponse<CategoryResponse>> {
    return apiCall('GET', `/categories/${id}`);
  },

  /**
   * POST /categories
   */
  async createCategory(request: CreateCategoryRequest): Promise<ApiResponse<CategoryResponse>> {
    return apiCall('POST', '/categories', request);
  },

  /**
   * PUT /categories/{id}
   */
  async updateCategory(id: number, request: UpdateCategoryRequest): Promise<ApiResponse<CategoryResponse>> {
    return apiCall('PUT', `/categories/${id}`, request);
  },

  /**
   * DELETE /categories/{id}
   */
  async deleteCategory(id: number): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/categories/${id}`);
  },
};