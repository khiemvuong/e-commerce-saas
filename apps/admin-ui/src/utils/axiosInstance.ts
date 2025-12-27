import { createAxiosInstance } from "packages/utils/axios";

/**
 * Axios instance configured for admin-ui application
 * - Handles authentication via cookies (withCredentials)
 * - Automatic token refresh on 401 errors using admin-specific endpoint
 * - Redirects to / when authentication fails
 */
const axiosInstance = createAxiosInstance({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  refreshTokenEndpoint: '/api/admin-refresh-token', // Admin-specific endpoint
  loginPath: '/',
  publicPaths: ['/'],
  enableLogging: process.env.NODE_ENV === 'development'
});

export default axiosInstance;
