import type { ApiResponse, RefreshTokenRequest, AuthResponse } from '../types';

const API_BASE_URL = 'https://api-techstore.kieutung.online/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Hàm gọi refreshToken chuyên dụng (gọi BE)
 */
const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const request: RefreshTokenRequest = { refreshToken };

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Failed to refresh token');
  }

  const result: ApiResponse<AuthResponse> = await response.json();
  const newAccessToken = result.data!.accessToken;
  const newRefreshToken = result.data!.refreshToken;

  
  localStorage.setItem('accessToken', newAccessToken);
  localStorage.setItem('refreshToken', newRefreshToken);

  return newAccessToken;
};

/**
 * Hàm gọi API chính, hỗ trợ FormData và Interceptor
 */
export const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: unknown,
  isRetry = false
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers();

  let body: BodyInit | undefined = undefined;

  if (data && !(data instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
    body = data ? JSON.stringify(data) : undefined;
  } else if (data instanceof FormData) {
    body = data;
  }

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const options: RequestInit = {
    method,
    headers,
    body,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      if (response.status === 401 && !isRetry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(newAccessToken => {
              headers.set('Authorization', `Bearer ${newAccessToken as string}`); 
              options.headers = headers; 
              return fetch(`${API_BASE_URL}${endpoint}`, options);
            })
            .then(async (res) => {
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({ message: res.statusText }));
                  throw new Error(errorData.message);
                }
                const text = await res.text();
                if (!text) {
                  return { success: true, data: null, message: 'OK', status: 'OK', timestamp: new Date().toISOString() } as ApiResponse<T>;
                }
                return JSON.parse(text) as ApiResponse<T>;
            });
        }

        isRefreshing = true;

        try {
          const newAccessToken = await refreshAuthToken();
          processQueue(null, newAccessToken);
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          options.headers = headers; 
          response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        } catch (error: unknown) {
          processQueue(error, null);
          throw error; 
        } finally {
          isRefreshing = false;
        }
      }

      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
    }

    
    const text = await response.text();
    if (!text) {
      
      return {
        success: true,
        data: null as T,
        message: 'Operation successful',
        status: 'OK',
        timestamp: new Date().toISOString(),
      };
    }

    return JSON.parse(text) as ApiResponse<T>;
  } catch (error: unknown) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    
    const message = (error as Error).message || 'An unknown error occurred';
    throw {
      success: false,
      data: null,
      message: message,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
    };
  }
};