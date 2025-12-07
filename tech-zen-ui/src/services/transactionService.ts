import { apiCall } from './api';
import type {
  ApiResponse,
  PagedResponse,
  WalletTransactionResponse,
  TransactionSearchRequest,
  AdminTransactionSearchRequest,
  CreateTransactionRequest,
  UpdateTransactionRequest,
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

export const transactionService = {
  /**
   * GET /transactions (User)
   */
  async getTransactions(
    params: TransactionSearchRequest & { page?: number; size?: number }
  ): Promise<ApiResponse<PagedResponse<WalletTransactionResponse>>> {
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return apiCall('GET', `/transactions${queryString}`);
  },

  /**
   * GET /transactions/admin/all (Admin)
   */
  async getAdminTransactions(
    params: AdminTransactionSearchRequest & { page?: number; size?: number }
  ): Promise<ApiResponse<PagedResponse<WalletTransactionResponse>>> {
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return apiCall('GET', `/transactions/admin/all${queryString}`);
  },
  
  /**
   * POST /transactions/admin (Admin)
   */
  async createTransaction(request: CreateTransactionRequest): Promise<ApiResponse<WalletTransactionResponse>> {
    return apiCall('POST', '/transactions/admin', request);
  },
  
  /**
   * PUT /transactions/admin/{id} (Admin)
   */
  async updateTransaction(id: string, request: UpdateTransactionRequest): Promise<ApiResponse<WalletTransactionResponse>> {
    return apiCall('PUT', `/transactions/admin/${id}`, request);
  },

  /**
   * DELETE /transactions/admin/{id} (Admin)
   */
  async deleteTransaction(id: string): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/transactions/admin/${id}`);
  }
};