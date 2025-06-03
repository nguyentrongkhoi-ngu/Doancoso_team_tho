/**
 * Response helper utilities for consistent API responses
 */

import { NextResponse } from 'next/server';
import { SUCCESS_MESSAGES } from './constants';
import type { ApiResponse, PaginatedResponse, SearchResponse } from '@/types/api';

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Create search response
 */
export function createSearchResponse<T>(
  results: T[],
  total: number,
  page: number,
  limit: number,
  query?: string,
  filters?: Record<string, any>
): NextResponse<SearchResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    success: true,
    results,
    total,
    page,
    limit,
    totalPages,
    query,
    filters,
  });
}

/**
 * Create created response (201)
 */
export function createCreatedResponse<T>(
  data?: T,
  message: string = SUCCESS_MESSAGES.CREATED
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, message, 201);
}

/**
 * Create updated response
 */
export function createUpdatedResponse<T>(
  data?: T,
  message: string = SUCCESS_MESSAGES.UPDATED
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, message);
}

/**
 * Create deleted response
 */
export function createDeletedResponse(
  message: string = SUCCESS_MESSAGES.DELETED
): NextResponse<ApiResponse<null>> {
  return createSuccessResponse(null, message);
}

/**
 * Create no content response (204)
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create accepted response (202)
 */
export function createAcceptedResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, message, 202);
}

/**
 * Helper to extract pagination params from URL
 */
export function extractPaginationParams(url: URL): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '12')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Helper to extract sort params from URL
 */
export function extractSortParams(url: URL): {
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

  return { sortBy, sortOrder };
}

/**
 * Helper to extract filter params from URL
 */
export function extractFilterParams(
  url: URL,
  allowedFilters: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};

  allowedFilters.forEach(filter => {
    const value = url.searchParams.get(filter);
    if (value) {
      filters[filter] = value;
    }
  });

  return filters;
}

/**
 * Helper to build Prisma where clause from filters
 */
export function buildWhereClause(filters: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Handle different filter types
      if (key.endsWith('_contains')) {
        const field = key.replace('_contains', '');
        where[field] = { contains: value, mode: 'insensitive' };
      } else if (key.endsWith('_gte')) {
        const field = key.replace('_gte', '');
        where[field] = { gte: value };
      } else if (key.endsWith('_lte')) {
        const field = key.replace('_lte', '');
        where[field] = { lte: value };
      } else if (key.endsWith('_in')) {
        const field = key.replace('_in', '');
        where[field] = { in: Array.isArray(value) ? value : [value] };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
}

/**
 * Helper to build Prisma orderBy clause
 */
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sortBy) {
    return undefined;
  }

  return { [sortBy]: sortOrder };
}

/**
 * Helper to validate and parse JSON from request body
 */
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Helper to get request URL with proper typing
 */
export function getRequestUrl(request: Request): URL {
  return new URL(request.url);
}

/**
 * Helper to extract path parameters
 */
export function extractPathParams(
  params: { [key: string]: string | string[] | undefined }
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      result[key] = value[0];
    }
  });

  return result;
}

/**
 * Helper to create cache headers
 */
export function createCacheHeaders(maxAge: number = 300): Headers {
  const headers = new Headers();
  headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  headers.set('Vary', 'Accept-Encoding');
  return headers;
}

/**
 * Helper to create CORS headers
 */
export function createCorsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return headers;
}

/**
 * Helper to merge headers
 */
export function mergeHeaders(...headerSets: (Headers | Record<string, string>)[]): Headers {
  const merged = new Headers();

  headerSets.forEach(headers => {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        merged.set(key, value);
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        merged.set(key, value);
      });
    }
  });

  return merged;
}
