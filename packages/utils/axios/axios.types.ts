import type { AxiosRequestConfig } from 'axios';

/**
 * Configuration options for creating an axios instance
 */
export interface AxiosInstanceConfig {
  /** Base URL for all requests */
  baseURL?: string;
  /** Endpoint to refresh access token */
  refreshTokenEndpoint: string;
  /** Path to redirect when authentication fails */
  loginPath: string;
  /** Array of public paths that don't require authentication */
  publicPaths?: string[];
  /** Enable request/response logging in development */
  enableLogging?: boolean;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Standard API error format
 */
export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
}

/**
 * Extended Axios request config with retry flag
 */
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}
