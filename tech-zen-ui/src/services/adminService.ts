import { apiCall } from './api';
import type {
  ApiResponse,
  AnalyticsOverviewResponse,
  ReportDailyResponse,
  PaymentMethodResponse,
  ReportSearchRequest,
} from '../types';

/**
 * Helper để biến object params thành query string
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => {
      // Xử lý params lồng nhau (cho search)
      if (key === 'search' && typeof params[key] === 'object' && params[key]) {
        const searchParams = params[key] as Record<string, string>;
        return Object.entries(searchParams)
          .map(([searchKey, searchValue]) => `search.${searchKey}=${encodeURIComponent(searchValue)}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`;
    })
    .join('&');
  return query ? `?${query}` : '';
};


export const adminService = {
  // --- Analytics ---

  /**
   * GET /admin/analytics/overview
   */
  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverviewResponse>> {
    return apiCall('GET', '/admin/analytics/overview');
  },

  /**
   * GET /admin/analytics/daily
   */
  async getDailyReports(request: ReportSearchRequest): Promise<ApiResponse<ReportDailyResponse[]>> {
    // SỬA LỖI: Casting
    const queryString = buildQueryString(request as unknown as Record<string, unknown>);
    return apiCall('GET', `/admin/analytics/daily${queryString}`);
  },

  // --- Payment Methods ---

  /**
   * GET /admin/payment-methods/active
   */
  async getActivePaymentMethods(): Promise<ApiResponse<PaymentMethodResponse[]>> {
    return apiCall('GET', '/payment-methods/active');
  },
  
  /**
   * PUT /admin/payment-methods/{id}/toggle
   */
  async togglePaymentMethod(id: number): Promise<ApiResponse<PaymentMethodResponse>> {
    return apiCall('PUT', `/payment-methods/${id}/toggle`, {}); 
  },
};