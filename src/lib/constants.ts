/**
 * Application constants and configuration
 */

// Environment
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// API Configuration
export const API_ROUTES = {
  CHAT: '/api/chat',
  ADMIN: '/api/admin',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  USERS: '/api/users',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  SEARCH_EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 1000,
  CLEANUP_PERCENTAGE: 0.2, // 20%
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

// Chat Status
export const CHAT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CLOSED: 'closed',
} as const;

// File Upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  NETWORK_ERROR: 'Network error',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  OPERATION_SUCCESS: 'Operation completed successfully',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy HH:mm',
  DATE_ONLY: 'dd/MM/yyyy',
  TIME_ONLY: 'HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

// Currency
export const CURRENCY = {
  CODE: 'VND',
  LOCALE: 'vi-VN',
  SYMBOL: '₫',
} as const;

// Recommendation Types
export const RECOMMENDATION_TYPES = {
  PERSONALIZED: 'personalized',
  AI_PERSONALIZED: 'ai_personalized',
  POPULAR: 'popular',
  COLLABORATIVE: 'collaborative',
  CONTENT_BASED: 'content_based',
  HYBRID: 'hybrid',
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW: 'product_view',
  PRODUCT_CLICK: 'product_click',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  PURCHASE: 'purchase',
  SEARCH: 'search',
  RECOMMENDATION_CLICK: 'recommendation_click',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_RECOMMENDATIONS: true,
  ENABLE_CHAT: true,
  ENABLE_REVIEWS: true,
  ENABLE_WISHLIST: true,
} as const;
