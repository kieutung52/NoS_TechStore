import { apiCall } from './api';
import type {
  WalletResponse,
  WalletTransactionResponse,
  ApiResponse,
  PagedResponse,
  DepositRequest,
  WithdrawalRequest,
  ValidatePinRequest,
  ActivateWalletRequest,
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

export const walletService = {
  /**
   * GET /wallets
   * @param bypassCache - Nếu true, thêm timestamp để bypass cache (dùng khi refresh sau khi có thay đổi)
   */
  async getWallet(bypassCache: boolean = false): Promise<ApiResponse<WalletResponse>> {
    const endpoint = bypassCache 
      ? `/wallets?_t=${Date.now()}` // Cache busting parameter
      : '/wallets';
    return apiCall('GET', endpoint);
  },

  /**
   * POST /wallets/deposit
   */
  async deposit(request: DepositRequest): Promise<ApiResponse<WalletResponse>> {
    return apiCall('POST', '/wallets/deposit', request);
  },
  
  /**
   * POST /wallets/withdrawal
   */
  async withdraw(request: WithdrawalRequest): Promise<ApiResponse<WalletResponse>> {
    return apiCall('POST', '/wallets/withdrawal', request);
  },

  /**
   * POST /wallets/activate
   */
  async activateWallet(request: ActivateWalletRequest): Promise<ApiResponse<WalletResponse>> {
    return apiCall('POST', '/wallets/activate', request);
  },

  /**
   * POST /wallets/validate-pin
   */
  async validatePin(request: ValidatePinRequest): Promise<ApiResponse<null>> {
    return apiCall('POST', '/wallets/validate-pin', request);
  },

  /**
   * GET /wallets/transactions
   */
  async getTransactions(
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PagedResponse<WalletTransactionResponse>>> {
    const queryString = buildQueryString({ page, size });
    return apiCall('GET', `/wallets/transactions${queryString}`);
  }
};