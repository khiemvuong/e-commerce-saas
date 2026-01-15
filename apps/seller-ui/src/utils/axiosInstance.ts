import { createAxiosInstance } from 'packages/utils/axios/createAxiosInstance';

/**
 * Axios instance configured for seller-ui application
 * - Handles authentication via cookies (withCredentials)
 * - Automatic token refresh on 401 errors
 * - Redirects to /login when authentication fails
 */
const axiosInstance = createAxiosInstance({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  refreshTokenEndpoint: '/api/refresh-token',
  loginPath: '/login',
  publicPaths: ['/login'],
  enableLogging: process.env.NODE_ENV === 'development'
});

export default axiosInstance;
