import { createAxiosInstance } from 'packages/utils/axios/createAxiosInstance';

const axiosInstance = createAxiosInstance({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  refreshTokenEndpoint: '/api/refresh-token',
  loginPath: '/login',
  publicPaths: ['/'],
  enableLogging: process.env.NODE_ENV === 'development'
});

export default axiosInstance;
