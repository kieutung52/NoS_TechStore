import { apiCall } from './api';
import type {
  UserResponse,
  ApiResponse,
  PagedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
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

export const userService = {
  /**
   * GET /users/profile
   */
  async getProfile(): Promise<ApiResponse<UserResponse>> {
    return apiCall('GET', '/users/profile');
  },

  /**
   * PUT /users/profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    return apiCall('PUT', '/users/profile', request);
  },

  /**
   * GET /users/all (Admin)
   */
  async getUsers(
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PagedResponse<UserResponse>>> {
    // BE [cite: 3010-3011] không có param 'search'
    const queryString = buildQueryString({ page, size });
    return apiCall('GET', `/users/all${queryString}`);
  },

  /**
   * GET /users/{id} (Admin)
   */
  async getUserById(id: string): Promise<ApiResponse<UserResponse>> {
    return apiCall('GET', `/users/${id}`);
  },

  /**
   * POST /users (Admin)
   */
  async createUser(request: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return apiCall('POST', '/users', request);
  },

  /**
   * PUT /users/{id} (Admin)
   */
  async updateUser(id: string, request: UpdateUserRequest): Promise<ApiResponse<UserResponse>> {
    return apiCall('PUT', `/users/${id}`, request);
  },

  /**
   * DELETE /users/{id} (Admin)
   */
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/users/${id}`);
  }
};