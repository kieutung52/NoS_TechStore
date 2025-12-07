import { apiCall } from './api';
import type {
  AuthResponse,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
  ForgotPasswordRequest,
  OtpValidationRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  IntrospectRequest,
  IntrospectResponse, 
} from '../types'; 

// Helper để lưu session
const setAuthSession = (data: AuthResponse) => {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  localStorage.setItem('user', JSON.stringify(data.user));
};

// Helper để xóa session
const clearAuthSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const authService = {
  /**
   * POST /auth/login
   */
  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiCall<AuthResponse>('POST', '/auth/login', request);
    if (response.success && response.data) {
      setAuthSession(response.data);
    }
    return response;
  },

  /**
   * POST /auth/register
   */
  async register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    
    return apiCall('POST', '/auth/register', request);
  },

  /**
   * POST /auth/logout
   */
  async logout(request: IntrospectRequest): Promise<ApiResponse<null>> {
    try {
      
      await apiCall<null>('POST', '/auth/logout', request);
    } catch (error) {
      console.error("Logout failed on server, clearing session anyway", error);
    }
    clearAuthSession(); 
    return {
      success: true,
      data: null,
      message: 'Logged out successfully',
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * POST /auth/refresh-token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    
    return apiCall('POST', '/auth/refresh-token', request);
  },

  /**
   * POST /auth/forgot-password (BE [cite: 3043-3044])
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return apiCall('POST', '/auth/forgot-password', request);
  },

  /**
   * POST /auth/validate-otp (BE [cite: 3042-3043])
   */
  async validateOtp(request: OtpValidationRequest): Promise<ApiResponse<null>> {
    return apiCall('POST', '/auth/validate-otp', request);
  },

  /**
   * POST /auth/reset-password (BE [cite: 3044-3045])
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<null>> {
    return apiCall('POST', '/auth/reset-password', request);
  },

  /**
   * POST /auth/generate-otp (BE [cite: 3041-3042])
   * Endpoint này trong BE dùng cho ForgotPassword
   */
  async generateOtp(request: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return apiCall('POST', '/auth/generate-otp', request);
  },
  
  /**
   * POST /auth/introspect (BE [cite: 3045-3046])
   */
  async introspect(request: IntrospectRequest): Promise<ApiResponse<IntrospectResponse>> {
    return apiCall('POST', '/auth/introspect', request);
  },

  /**
   * Kiểm tra trạng thái đăng nhập (local)
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Lấy user từ local storage
   */
  getCurrentUser(): Partial<UserResponse> | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        
        return JSON.parse(userStr) as Partial<UserResponse>;
      } catch (e) {
        return null;
      }
    }
    return null;
  },
};