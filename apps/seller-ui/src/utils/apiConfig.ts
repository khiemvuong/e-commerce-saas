// Centralized API configuration for seller-ui
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
    STATIC: 60 * 60 * 1000,       // 1 hour - categories, site config
    PRODUCTS: 5 * 60 * 1000,      // 5 minutes - product listings
    ORDERS: 2 * 60 * 1000,        // 2 minutes - order data (more dynamic)
    DISCOUNTS: 10 * 60 * 1000,    // 10 minutes - discount codes
    ANALYTICS: 5 * 60 * 1000,     // 5 minutes - shop analytics
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
    if (status === 400) {
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
      message: error.response.data?.message || 'Đã có lỗi xảy ra', 
      status 
    };
  }
  
  // Handle timeout
  if (error.code === 'ECONNABORTED') {
    return { type: 'TIMEOUT', message: 'Yêu cầu quá thời gian, vui lòng thử lại' };
  }
  
  // Handle network errors
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return { type: 'NETWORK_ERROR', message: 'Lỗi kết nối mạng' };
  }
  
  return { type: 'UNKNOWN', message: error.message || 'Đã có lỗi xảy ra' };
};

// Query key factories for consistent key management
export const queryKeys = {
  categories: ['categories'] as const,
  discounts: ['shop-discounts'] as const,
  products: {
    all: ['shop-products'] as const,
    detail: (id: string) => ['shop-products', 'detail', id] as const,
  },
  events: {
    all: ['shop-events'] as const,
  },
  orders: {
    all: ['shop-orders'] as const,
    detail: (id: string) => ['shop-orders', 'detail', id] as const,
  },
  analytics: ['shop-analytics'] as const,
  notifications: ['notifications'] as const,
};
