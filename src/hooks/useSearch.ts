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
    // Chỉ đồng bộ khi lần đầu render hoặc khi URL thay đổi từ bên ngoài (không phải do người dùng nhập)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Thoát sớm nếu là lần render đầu tiên
    } 
    
    if (isUserTyping) {
      // Nếu người dùng đang nhập, bỏ qua đồng bộ từ URL
      return;
    }

    const currentQuery = searchParams.get('q') || '';
    
    // Đánh dấu đây là thay đổi từ URL
    isURLChangeRef.current = true;
    
    try {
      // Chỉ cập nhật khi thực sự có thay đổi và giá trị hiện tại không phải từ người dùng thao tác
      if (currentQuery !== searchTerm && 
          currentQuery !== lastManualSearchTermRef.current &&
          !isUserTyping) {
            
        // Nên có một độ trễ nhỏ để tránh xung đột với input người dùng đang nhập
        setTimeout(() => {
          if (!isUserTyping && isMounted.current) {
            setSearchTermState(currentQuery);
            
            // Nếu URL đã thay đổi, cập nhật lại giá trị lưu trữ cuối cùng
            // Điều này giúp tránh trạng thái không nhất quán
            lastManualSearchTermRef.current = currentQuery;
          }
        }, 100);
      }
      
      // Đồng bộ bộ lọc từ URL nếu không đang nhập liệu
      if (!isUserTyping) {
        const urlFilters = {
          category: searchParams.get('category') || undefined,
          minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0') : undefined,
          maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0') : undefined,
          sort: searchParams.get('sort') || 'relevance',
          inStock: searchParams.get('inStock') === 'true' || undefined,
          rating: searchParams.get('rating') ? parseInt(searchParams.get('rating') || '0') : undefined,
        };
        
        // Sử dụng hàm cập nhật state để tránh race conditions
        setFilters(prevFilters => {
          // Chỉ cập nhật nếu có sự thay đổi
          if (JSON.stringify(urlFilters) !== JSON.stringify(prevFilters)) {
            return urlFilters;
          }
          return prevFilters;
        });
      }
    } finally {
      // Reset cờ đánh dấu sau một khoảng thời gian dài hơn
      // Điều này giúp tránh các vấn đề về timing
      setTimeout(() => {
        if (isMounted.current) {
          isURLChangeRef.current = false;
        }
      }, 150);
    }
  }, [searchParams, searchTerm, isUserTyping, setSearchTermState]);

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

  // Hàm set search term với định danh type để tránh lỗi khi re-render
  const setSearchTerm = useCallback((term: string) => {
    // Nếu đang xảy ra thay đổi từ URL, bỏ qua việc cập nhật này
    if (isURLChangeRef.current) {
      return;
    }
    
    if (term !== searchTerm) {
      // Lưu lại giá trị searchTerm được đặt theo cách thủ công
      lastManualSearchTermRef.current = term;
      setSearchTermState(term);
    }
  }, [searchTerm, setSearchTermState]);

  // Fetch suggestions với debounce để tránh gọi API quá nhiều
  useEffect(() => {
    // Nếu đây là thay đổi từ URL, không cần fetch suggestions
    if (isURLChangeRef.current) {
      return;
    }
    
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
          // Cache hết hạn, xóa
          suggestionsCache.delete(cacheKey);
        }
      }
      
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(searchTerm)}`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
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
          
          // Lưu vào cache
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

    // Debounce fetch để tránh gọi API liên tục khi người dùng đang nhập
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

  // Thực hiện tìm kiếm có debounce để tránh tạo nhiều URL updates
  const executeSearch = useCallback((term?: string) => {
    const searchValue = term !== undefined ? term : searchTerm;
    
    // Đảm bảo giá trị tìm kiếm hợp lệ trước khi lưu
    if (searchValue && searchValue.trim() !== '') {
      saveSearch(searchValue.trim());
    }
    
    // Đánh dấu đang trong quá trình tìm kiếm
    setIsSearching(true);
    
    // Clear any existing debounce
    if (urlUpdateDebounceRef.current) {
      clearTimeout(urlUpdateDebounceRef.current);
    }
    
    // Đảm bảo không đang nhập liệu
    setIsUserTyping(false);
    
    // Lưu giá trị search term cuối cùng được đặt theo cách thủ công
    lastManualSearchTermRef.current = searchValue;
    
    // Debounce URL updates
    urlUpdateDebounceRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      // Build URL params
      const params = new URLSearchParams();
      if (searchValue && searchValue.trim() !== '') {
        params.set('q', searchValue.trim());
      }
      
      // Add all active filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          params.set(key, String(value));
        }
      });
      
      // Chuyển hướng đến trang tìm kiếm
      router.push(`/search?${params.toString()}`);
      
      // Đánh dấu kết thúc quá trình tìm kiếm sau khi chuyển hướng
      // và delay dài hơn để đảm bảo trang đã load xong
      setTimeout(() => {
        if (isMounted.current) {
          setIsSearching(false);
        }
      }, 300);
    }, URL_UPDATE_DEBOUNCE_TIME);
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