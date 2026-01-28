// Centralized API configuration for admin-ui
// Used for React Query staleTime, timeout, and error handling

export const API_CONFIG = {
  // Timeout settings (milliseconds)
  TIMEOUT: {
    DEFAULT: 10000,    // 10 seconds
    FAST: 5000,        // 5 seconds for simple GETs
    LONG: 30000,       // 30 seconds for file uploads
  },
  
  // Stale time settings (milliseconds) - for React Query
  STALE_TIME: {
    STATIC: 60 * 60 * 1000,       // 1 hour - static data
    PRODUCTS: 5 * 60 * 1000,      // 5 minutes - product listings
    ORDERS: 2 * 60 * 1000,        // 2 minutes - order data (more dynamic)
    USERS: 5 * 60 * 1000,         // 5 minutes - user data
    SELLERS: 5 * 60 * 1000,       // 5 minutes - seller data
    ANALYTICS: 5 * 60 * 1000,     // 5 minutes - analytics
    NOTIFICATIONS: 1 * 60 * 1000, // 1 minute - notifications
  },
  
  // Garbage collection time (milliseconds)
  GC_TIME: {
    DEFAULT: 30 * 60 * 1000,      // 30 minutes
    SHORT: 10 * 60 * 1000,        // 10 minutes
  },
  
  // Retry configuration
  RETRY: {
    DEFAULT: 3,
    MUTATION: 0,  // Don't retry mutations
  },
};

// Error handler utility for consistent error processing
export interface ApiErrorResult {
  type: 'AUTH_ERROR' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
  message: string;
  status?: number;
}

export const handleApiError = (error: any): ApiErrorResult => {
  // Handle Axios errors
  if (error.response) {
    const status = error.response.status;
    
    if (status === 401) {
      return { type: 'AUTH_ERROR', message: 'Phiên đăng nhập hết hạn', status };
    }
    if (status === 403) {
      return { type: 'AUTH_ERROR', message: 'Không có quyền truy cập', status };
    }
    if (status === 404) {
      return { type: 'VALIDATION_ERROR', message: 'Không tìm thấy dữ liệu', status };
    }
    if (status === 422) {
      return { 
        type: 'VALIDATION_ERROR', 
        message: error.response.data?.message || 'Dữ liệu không hợp lệ', 
        status 
      };
    }
    if (status >= 500) {
      return { type: 'SERVER_ERROR', message: 'Lỗi server, vui lòng thử lại sau', status };
    }
    
    return { 
      type: 'UNKNOWN', 
      message: error.response.data?.message || 'Có lỗi xảy ra', 
      status 
    };
  }
  
  // Handle timeout
  if (error.code === 'ECONNABORTED') {
    return { type: 'TIMEOUT', message: 'Kết nối bị gián đoạn' };
  }
  
  // Handle network errors
  if (error.message === 'Network Error') {
    return { type: 'NETWORK_ERROR', message: 'Lỗi kết nối mạng' };
  }
  
  return { type: 'UNKNOWN', message: error.message || 'Có lỗi xảy ra' };
};

// Query key factory for consistent cache management
export const queryKeys = {
  admin: ['admin'] as const,
  users: {
    all: ['users'] as const,
    list: (page: number, limit: number, search?: string) => 
      ['users', 'list', page, limit, search] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  sellers: {
    all: ['sellers'] as const,
    list: (page: number, limit: number, search?: string) => 
      ['sellers', 'list', page, limit, search] as const,
    detail: (id: string) => ['sellers', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (page: number, limit: number, search?: string) => 
      ['products', 'list', page, limit, search] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (page: number, limit: number) => ['orders', 'list', page, limit] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
  },
  notifications: ['notifications'] as const,
};
