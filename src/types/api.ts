/**
 * API Response Types
 */

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Paginated Response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Response
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}

// Search Response
export interface SearchResponse<T> {
  success: boolean;
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query?: string;
  filters?: Record<string, any>;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  status: 'active' | 'pending' | 'closed';
  startTime: Date;
  endTime?: Date;
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
  metadata?: Record<string, any>;
}



// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  images?: ProductImage[];
  reviews?: Review[];
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  order: number;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  parentId?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

// User Types
export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  notes?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface ShippingAddress {
  id: string;
  orderId: string;
  fullName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber: string;
}

// Cart Types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

// Recommendation Types
export interface RecommendationInteraction {
  id: string;
  userId: string;
  productId: string;
  recommendationType: string;
  interactionType: 'view' | 'cart' | 'purchase';
  timestamp: Date;
}

export interface RecommendationPerformance {
  id: string;
  algorithmType: string;
  viewCount: number;
  cartCount: number;
  purchaseCount: number;
  conversionRate: number;
  startDate: Date;
  endDate: Date;
}

// Analytics Types
export interface UserBehaviorAnalysis {
  id: string;
  userId: string;
  topCategories: string;
  topBrands: string;
  productPreferences: string;
  shoppingPatterns: string;
  marketingStrategies: string;
  behaviorMetrics?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProductForm {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  isFeatured: boolean;
  imageUrl?: string;
}

export interface CategoryForm {
  name: string;
  description?: string;
  parentId?: string;
  isFeatured: boolean;
  imageUrl?: string;
}

// Filter Types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
}

// Utility Types
export type SortOrder = 'asc' | 'desc';
export type UserRole = 'user' | 'admin' | 'moderator';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ChatRole = 'user' | 'assistant' | 'system';
export type InteractionType = 'view' | 'cart' | 'purchase';
