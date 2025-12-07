import { apiCall } from './api';
import type {
  OrderResponse,
  ApiResponse,
  PagedResponse,
  CreateOrderRequest,
  OrderSearchRequest,
  AdminOrderSearchRequest,
  CancelOrderRequest,
  ShipOrderRequest,
  UpdateOrderLocationRequest,
} from '../types'; 

/**
 * Helper để biến object params thành query string
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => {
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


function normalizeOrderObj(obj: unknown): OrderResponse {
  const dataObj = obj as unknown as Record<string, unknown>;
  const details = (dataObj['orderDetails'] as unknown as OrderResponse['details']) ?? (dataObj['details'] as unknown as OrderResponse['details']) ?? [];
  return { ...(obj as OrderResponse), details } as OrderResponse;
}

export const orderService = {
  /**
   * POST /orders
   */
  async createOrder(
    request: CreateOrderRequest
  ): Promise<ApiResponse<OrderResponse>> {
    return apiCall('POST', '/orders', request);
  },

  /**
   * GET /orders/{id}
   */
  async getOrderById(id: string): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('GET', `/orders/${id}`);
    
    if (res.success && res.data) {
      const dataObj = res.data as unknown as Record<string, unknown>;
      const orderDetails = (dataObj['orderDetails'] as unknown as OrderResponse['details']) ?? (dataObj['details'] as unknown as OrderResponse['details']) ?? [];
      const normalized: OrderResponse = { ...(res.data as OrderResponse), details: orderDetails };
      return { ...res, data: normalized };
    }
    return res;
  },

  
  _normalizeOrder(obj: unknown): OrderResponse {
    const dataObj = obj as unknown as Record<string, unknown>;
    const details = (dataObj['orderDetails'] as unknown as OrderResponse['details']) ?? (dataObj['details'] as unknown as OrderResponse['details']) ?? [];
    return { ...(obj as OrderResponse), details } as OrderResponse;
  },

  /**
   * GET /orders (User)
   */
  async getUserOrders(
    params: OrderSearchRequest & { page?: number; size?: number }
  ): Promise<ApiResponse<PagedResponse<OrderResponse>>> {
    
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    const res = await apiCall<PagedResponse<OrderResponse>>('GET', `/orders${queryString}`);
    if (res.success && res.data) {
      const mappedContent = (res.data.content || []).map((o) => {
        const obj = o as unknown as Record<string, unknown>;
        const details = (obj['orderDetails'] as unknown as OrderResponse['details']) ?? (obj['details'] as unknown as OrderResponse['details']) ?? [];
        return { ...(o as OrderResponse), details } as OrderResponse;
      });
      const newData = { ...res.data, content: mappedContent };
      return { ...res, data: newData };
    }
    return res;
  },

  async deliverOrder(id: string): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('PUT', `/orders/${id}/deliver`, {});
    if (res.success && res.data) {
      const normalized = normalizeOrderObj(res.data);
      return { ...res, data: normalized };
    }
    return res;
  },

  

  /**
   * GET /orders/admin/all (Admin)
   */
  async getAdminOrders(
    params: AdminOrderSearchRequest & { page?: number; size?: number }
  ): Promise<ApiResponse<PagedResponse<OrderResponse>>> {
    
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    const res = await apiCall<PagedResponse<OrderResponse>>('GET', `/orders/admin/all${queryString}`);
    if (res.success && res.data) {
      const mappedContent = (res.data.content || []).map((o) => {
        const obj = o as unknown as Record<string, unknown>;
        const details = (obj['orderDetails'] as unknown as OrderResponse['details']) ?? (obj['details'] as unknown as OrderResponse['details']) ?? [];
        return { ...(o as OrderResponse), details } as OrderResponse;
      });
      const newData = { ...res.data, content: mappedContent };
      return { ...res, data: newData };
    }
    return res;
  },

  /**
   * PUT /orders/admin/{id}/accept (Admin)
   */
  async acceptOrder(id: string): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('PUT', `/orders/admin/${id}/accept`, {});
    if (res.success && res.data) {
      const normalized = normalizeOrderObj(res.data);
      return { ...res, data: normalized };
    }
    return res;
  },

  /**
   * PUT /orders/admin/{id}/cancel (Admin)
   */
  async cancelOrder(id: string, request: CancelOrderRequest): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('PUT', `/orders/admin/${id}/cancel`, request);
    if (res.success && res.data) {
      const normalized = normalizeOrderObj(res.data);
      return { ...res, data: normalized };
    }
    return res;
  },

  /**
   * PUT /orders/admin/{id}/ship (Admin)
   */
  async shipOrder(id: string, request: ShipOrderRequest): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('PUT', `/orders/admin/${id}/ship`, request);
    if (res.success && res.data) {
      const normalized = normalizeOrderObj(res.data);
      return { ...res, data: normalized };
    }
    return res;
  },

  /**
   * PUT /orders/{id}/track (User & Admin)
   */
  async updateOrderLocation(id: string, request: UpdateOrderLocationRequest): Promise<ApiResponse<OrderResponse>> {
    const res = await apiCall<OrderResponse>('PUT', `/orders/${id}/track`, request);
    if (res.success && res.data) {
      const normalized = normalizeOrderObj(res.data);
      return { ...res, data: normalized };
    }
    return res;
  }
};