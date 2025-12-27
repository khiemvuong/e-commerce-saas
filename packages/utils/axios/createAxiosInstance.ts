import axios, { AxiosInstance, AxiosError } from 'axios';
import type { AxiosInstanceConfig, CustomAxiosRequestConfig } from './axios.types';


export function createAxiosInstance(config: AxiosInstanceConfig): AxiosInstance {
  const {
    baseURL,
    refreshTokenEndpoint,
    loginPath,
    publicPaths = [],
    enableLogging = false
  } = config;

  // Create base axios instance
  const instance = axios.create({
    baseURL,
    withCredentials: true,
  });

  // Token refresh state
  let isRefreshing = false;
  let refreshSubscribers: (() => void)[] = [];

  const handleLogout = (): void => {
    if (typeof window === 'undefined') return;
    
    const currentPath = window.location.pathname;
    const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path));
    
    if (!isPublicPath) {
      window.location.href = loginPath;
    }
  };

  /**
   * Add callback to be executed after token refresh succeeds
   */
  const subscribeTokenRefresh = (callback: () => void): void => {
    refreshSubscribers.push(callback);
  };

  /**
   * Execute all queued requests after successful token refresh
   */
  const onRefreshSuccess = (): void => {
    refreshSubscribers.forEach(callback => callback());
    refreshSubscribers = [];
  };

  // Request interceptor
  instance.interceptors.request.use(
    (requestConfig) => {
      if (enableLogging) {
        console.log(`🚀 Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
      }
      return requestConfig;
    },
    (error) => {
      if (enableLogging) {
        console.error('❌ Request Error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle token refresh
  instance.interceptors.response.use(
    (response) => {
      if (enableLogging) {
        console.log(`✅ Response: ${response.config.url} ${response.status}`);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const is401 = error.response?.status === 401;
      const isRetry = originalRequest._retry;

      // Only attempt refresh for 401 errors and non-retried requests
      if (is401 && !isRetry) {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh(() => {
              resolve(instance(originalRequest));
            });
          });
        }

        // Mark as retry to prevent infinite loops
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token
          await axios.post(
            `${baseURL}${refreshTokenEndpoint}`,
            {},
            { withCredentials: true }
          );

          if (enableLogging) {
            console.log('🔄 Token refreshed successfully');
          }

          // Reset state and execute queued requests
          isRefreshing = false;
          onRefreshSuccess();

          // Retry original request
          return instance(originalRequest);
        } catch (refreshError) {
          // Don't log refresh errors - they're expected when cookies are cleared after logout
          // User will be redirected to login anyway
          
          // Reset state and logout
          isRefreshing = false;
          refreshSubscribers = [];
          handleLogout();
          
          return Promise.reject(refreshError);
        }
      }

      // For non-401 errors or already retried requests
      // Don't log 401 errors as they're expected when not authenticated
      if (enableLogging && error.response?.status !== 401 && error.code !== 'ERR_CANCELED') {
        console.error(`❌ Response Error: ${error.config?.url}`, error.response?.status);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}
