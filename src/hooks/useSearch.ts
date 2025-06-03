import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: boolean;
  rating?: number;
}

export interface UseSearchProps {
  defaultSearchTerm?: string;
  defaultFilters?: SearchFilters;
  saveHistory?: boolean;
}

export interface UseSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  recentSearches: string[];
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFilters: () => void;
  executeSearch: (term?: string) => void;
  removeSavedSearch: (term: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
  setRecentSearches: (searches: string[]) => void;
  isUserTyping: boolean;
  setIsUserTyping: (isTyping: boolean) => void;
}

// Cache cho các gợi ý tìm kiếm để tránh gọi API liên tục
const suggestionsCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10 phút
const SUGGESTION_DEBOUNCE_TIME = 300; // ms
const URL_UPDATE_DEBOUNCE_TIME = 500; // ms

const useSearch = ({
  defaultSearchTerm = '',
  defaultFilters = { sort: 'relevance' },
  saveHistory = true
}: UseSearchProps = {}): UseSearchReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const urlUpdateDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const isURLChangeRef = useRef(false);
  const lastManualSearchTermRef = useRef<string>('');

  // State từ URL
  const searchQuery = searchParams.get('q') || defaultSearchTerm;
  const initialFilters = useMemo(() => {
    return {
      category: searchParams.get('category') || defaultFilters.category,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0') : defaultFilters.minPrice,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0') : defaultFilters.maxPrice,
      sort: searchParams.get('sort') || defaultFilters.sort || 'relevance',
      inStock: searchParams.get('inStock') === 'true' || defaultFilters.inStock,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating') || '0') : defaultFilters.rating,
    };
  }, [searchParams, defaultFilters]);

  // State
  const [searchTerm, setSearchTermState] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Clear all timeouts
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      
      if (urlUpdateDebounceRef.current) {
        clearTimeout(urlUpdateDebounceRef.current);
      }
    };
  }, []);

  // Đồng bộ trạng thái với URL khi tham số URL thay đổi
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Khởi tạo từ URL params lần đầu
      const currentQuery = searchParams.get('q') || '';
      if (currentQuery !== searchTerm) {
        setSearchTermState(currentQuery);
        lastManualSearchTermRef.current = currentQuery;
      }
      return;
    }

    // Không đồng bộ khi người dùng đang nhập
    if (isUserTyping) {
      return;
    }

    const currentQuery = searchParams.get('q') || '';

    // Chỉ cập nhật khi URL thực sự thay đổi và khác với giá trị hiện tại
    if (currentQuery !== searchTerm) {
      setSearchTermState(currentQuery);
      lastManualSearchTermRef.current = currentQuery;
    }

    // Đồng bộ bộ lọc từ URL
    const urlFilters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0') : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0') : undefined,
      sort: searchParams.get('sort') || 'relevance',
      inStock: searchParams.get('inStock') === 'true' || undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating') || '0') : undefined,
    };

    setFilters(urlFilters);
  }, [searchParams, isUserTyping]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && saveHistory) {
      try {
        const searches = localStorage.getItem('recentSearches');
        if (searches) {
          setRecentSearches(JSON.parse(searches));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
        // Nếu có lỗi, reset lại lịch sử tìm kiếm
        localStorage.setItem('recentSearches', JSON.stringify([]));
      }
    }
  }, [saveHistory]);

  // Hàm set search term
  const setSearchTerm = useCallback((term: string) => {
    if (term !== searchTerm) {
      lastManualSearchTermRef.current = term;
      setSearchTermState(term);
    }
  }, [searchTerm]);

  // Fetch suggestions với debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const cacheKey = searchTerm.toLowerCase().trim();

      // Kiểm tra cache
      if (suggestionsCache.has(cacheKey)) {
        const cachedData = suggestionsCache.get(cacheKey)!;
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_TIME) {
          setSuggestions(cachedData.data);
          return;
        } else {
          suggestionsCache.delete(cacheKey);
        }
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(searchTerm)}`, {
          signal: AbortSignal.timeout(3000)
        });

        if (!isMounted.current) return;

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = await response.json();

        if (!isMounted.current) return;

        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);

          suggestionsCache.set(cacheKey, {
            data: data.suggestions,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        if (isMounted.current) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    // Debounce fetch
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }

    suggestionDebounceRef.current = setTimeout(() => {
      if (isMounted.current) {
        fetchSuggestions();
      }
    }, SUGGESTION_DEBOUNCE_TIME);

    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
    };
  }, [searchTerm]);

  // Lưu tìm kiếm vào lịch sử
  const saveSearch = useCallback((term: string) => {
    if (!saveHistory || term.trim() === '') return;
    
    let searches = [...recentSearches];
    // Remove if exists to prevent duplicates
    searches = searches.filter(s => s !== term);
    // Add to beginning of array
    searches.unshift(term);
    // Keep only the last 10 searches
    searches = searches.slice(0, 10);
    
    setRecentSearches(searches);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }, [recentSearches, saveHistory]);

  // Xóa một tìm kiếm khỏi lịch sử
  const removeSavedSearch = useCallback((term: string) => {
    if (!saveHistory) return;
    
    const searches = recentSearches.filter(s => s !== term);
    setRecentSearches(searches);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }, [recentSearches, saveHistory]);

  // Set một filter
  const setFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      sort: 'relevance'
    });
  }, []);

  // Xóa tìm kiếm
  const clearSearch = useCallback(() => {
    lastManualSearchTermRef.current = '';
    setSearchTermState('');
    resetFilters();
  }, [resetFilters]);

  // Thực hiện tìm kiếm
  const executeSearch = useCallback((term?: string) => {
    const searchValue = term !== undefined ? term : searchTerm;

    // Lưu vào lịch sử tìm kiếm
    if (searchValue && searchValue.trim() !== '') {
      saveSearch(searchValue.trim());
    }

    setIsSearching(true);
    setIsUserTyping(false);
    lastManualSearchTermRef.current = searchValue;

    // Clear existing timeout
    if (urlUpdateDebounceRef.current) {
      clearTimeout(urlUpdateDebounceRef.current);
    }

    // Build URL params
    const params = new URLSearchParams();
    if (searchValue && searchValue.trim() !== '') {
      params.set('q', searchValue.trim());
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });

    // Navigate to search page
    router.push(`/search?${params.toString()}`);

    // Reset searching state
    setTimeout(() => {
      if (isMounted.current) {
        setIsSearching(false);
      }
    }, 300);
  }, [searchTerm, filters, saveSearch, router]);

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    isLoadingSuggestions,
    recentSearches,
    filters,
    setFilter,
    resetFilters,
    executeSearch,
    removeSavedSearch,
    clearSearch,
    isSearching,
    setRecentSearches,
    isUserTyping,
    setIsUserTyping
  };
};

export default useSearch; 