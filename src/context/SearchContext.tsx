'use client';

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import useSearch, { SearchFilters, UseSearchReturn } from '@/hooks/useSearch';

// Tạo context mặc định với giá trị rỗng
const SearchContext = createContext<UseSearchReturn | undefined>(undefined);

// Props cho SearchProvider
interface SearchProviderProps {
  children: ReactNode;
  defaultSearchTerm?: string;
  defaultFilters?: SearchFilters;
  saveHistory?: boolean;
}

// Provider component
export function SearchProvider({
  children,
  defaultSearchTerm,
  defaultFilters,
  saveHistory = true,
}: SearchProviderProps) {
  // Sử dụng hook useSearch để lấy tất cả chức năng tìm kiếm
  const searchContextValue = useSearch({
    defaultSearchTerm,
    defaultFilters,
    saveHistory,
  });

  // Memo hóa giá trị của context để tránh re-render không cần thiết
  const memoizedValue = useMemo(() => searchContextValue, [
    searchContextValue.searchTerm,
    searchContextValue.suggestions,
    searchContextValue.isLoadingSuggestions,
    searchContextValue.recentSearches,
    searchContextValue.filters,
    searchContextValue.isSearching
  ]);

  return (
    <SearchContext.Provider value={memoizedValue}>
      {children}
    </SearchContext.Provider>
  );
}

// Hook để sử dụng context
export function useSearchContext(): UseSearchReturn {
  const context = useContext(SearchContext);
  
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  
  return context;
}

// Hàm trợ giúp để kiểm tra xem một searchTerm có hợp lệ
export function isValidSearchTerm(term: string | null | undefined): boolean {
  return term !== null && term !== undefined && term.trim().length > 0;
}

// Hàm trợ giúp để xây dựng URL tìm kiếm
export function buildSearchUrl(term: string, filters?: SearchFilters): string {
  if (!term || term.trim() === '') {
    return '/';
  }
  
  const params = new URLSearchParams();
  params.set('q', term.trim());
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
  }
  
  return `/search?${params.toString()}`;
}

export default SearchContext; 