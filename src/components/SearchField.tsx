'use client';

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import useSearch, { SearchFilters } from '@/hooks/useSearch';

interface SearchFieldProps {
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  withSuggestions?: boolean;
  withFilters?: boolean;
  defaultFilters?: SearchFilters;
  onSearch?: (term: string, filters: SearchFilters) => void;
}

const SearchField = memo(({
  size = 'md',
  placeholder = 'Tìm kiếm sản phẩm...',
  className = '',
  autoFocus = false,
  withSuggestions = true,
  withFilters = false,
  defaultFilters,
  onSearch
}: SearchFieldProps) => {
  const {
    searchTerm,
    setSearchTerm,
    suggestions,
    isLoadingSuggestions,
    recentSearches,
    filters,
    executeSearch,
    removeSavedSearch,
    clearSearch,
    isSearching,
    setRecentSearches,
    isUserTyping,
    setIsUserTyping
  } = useSearch({ defaultFilters });
  
  // Local input state để tránh re-render và giật khi nhập
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const composingRef = useRef(false); // Theo dõi trạng thái nhập liệu IME
  const lastSearchTermRef = useRef(searchTerm || ''); // Lưu giá trị searchTerm cuối cùng
  
  // Đồng bộ từ searchTerm global sang inputValue khi searchTerm thay đổi từ bên ngoài 
  // (không phải do người dùng đang nhập)
  useEffect(() => {
    // Nếu searchTerm thay đổi từ bên ngoài (ví dụ: từ context hoặc prop) 
    // và khác với inputValue hiện tại, cập nhật inputValue
    if (!isUserTyping && searchTerm !== inputValue) {
      // Kiểm tra thêm để tránh trường hợp ghi đè lên input người dùng đang nhập
      if (inputRef.current && !document.activeElement?.contains(inputRef.current)) {
        setInputValue(searchTerm || '');
        lastSearchTermRef.current = searchTerm || '';
      }
    }
  }, [searchTerm, isUserTyping, inputValue]);

  // Auto focus on input if enabled
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      // Đảm bảo reset trạng thái nhập liệu khi unmount
      setIsUserTyping(false);
    };
  }, [setIsUserTyping]);

  // Theo dõi bắt đầu và kết thúc nhập IME (cho tiếng Việt và các ngôn ngữ khác)
  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
    setIsUserTyping(true); // Đánh dấu đang nhập liệu
  }, [setIsUserTyping]);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    
    // Cập nhật searchTerm sau khi hoàn thành nhập IME
    setSearchTerm(inputValue);
    
    // Đặt timeout dài hơn để đảm bảo đủ thời gian cho IME hoàn thành
    // và ngăn chặn việc ghi đè giá trị từ URL
    setTimeout(() => {
      if (!composingRef.current && inputRef.current) {
        // Đảm bảo giá trị cuối cùng được cập nhật chính xác
        setSearchTerm(inputRef.current.value);
        
        // Chỉ reset trạng thái typing sau khi IME đã hoàn thành hoàn toàn
        setTimeout(() => {
          if (!composingRef.current) {
            setIsUserTyping(false);
          }
        }, 100);
      }
    }, 150);
  }, [inputValue, setSearchTerm, setIsUserTyping]);

  // Xử lý nhập liệu 
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Đánh dấu đang nhập liệu
    setIsUserTyping(true);
    
    // Luôn cập nhật state local để hiển thị giá trị người dùng đang nhập
    setInputValue(value);
    
    // Nếu không đang trong quá trình nhập IME, thì mới update searchTerm với debounce
    if (!composingRef.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        // Chỉ cập nhật searchTerm khi giá trị thực sự thay đổi và input không rỗng
        if (value !== searchTerm) {
          setSearchTerm(value);
          lastSearchTermRef.current = value;
        }
        
        // Đợi thêm một chút trước khi reset trạng thái nhập liệu
        // để tránh xung đột với cập nhật từ URL
        if (!composingRef.current) {
          setTimeout(() => {
            if (!composingRef.current && inputRef.current && inputRef.current.value === value) {
              setIsUserTyping(false);
            }
          }, 150);
        }
      }, 300); // Debounce 300ms cho việc tìm gợi ý
    }

    // Hiển thị suggestions khi bắt đầu nhập
    if (!showSuggestions && value.trim().length > 0) {
      setShowSuggestions(true);
    }
  }, [setSearchTerm, showSuggestions, setIsUserTyping, searchTerm]);

  // Xử lý khi focus vào input
  const handleInputFocus = useCallback(() => {
    setShowSuggestions(true);
    
    // Đánh dấu đang nhập liệu khi focus để tránh đồng bộ từ URL
    // Chỉ đặt isUserTyping = true nếu input có giá trị
    if (inputValue) {
      setIsUserTyping(true);
    }
  }, [setIsUserTyping, inputValue]);

  // Xử lý khi blur khỏi input
  const handleInputBlur = useCallback(() => {
    // Chỉ đặt lại isUserTyping sau một khoảng thời gian
    // để tránh xung đột với các sự kiện click
    setTimeout(() => {
      if (!composingRef.current) {
        setIsUserTyping(false);
      }
    }, 200);
  }, [setIsUserTyping]);

  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    setSearchTerm(inputValue);
    lastSearchTermRef.current = inputValue;

    if (onSearch) {
      onSearch(inputValue, filters);
    } else {
      executeSearch(inputValue);
    }

    setShowSuggestions(false);
    setIsUserTyping(false);
  }, [onSearch, inputValue, filters, executeSearch, setSearchTerm, setIsUserTyping]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setIsUserTyping(false);
    setInputValue(suggestion);
    setSearchTerm(suggestion);
    lastSearchTermRef.current = suggestion;

    if (onSearch) {
      onSearch(suggestion, filters);
    } else {
      executeSearch(suggestion);
    }

    setShowSuggestions(false);
  }, [onSearch, filters, executeSearch, setSearchTerm, setIsUserTyping]);

  // Remove a saved search term
  const handleRemoveSavedSearch = useCallback((e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeSavedSearch(term);
  }, [removeSavedSearch]);

  // Handle clearing search input
  const handleClearSearch = useCallback(() => {
    setIsUserTyping(false);
    setInputValue('');
    clearSearch();
    lastSearchTermRef.current = '';

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [clearSearch, setIsUserTyping]);

  // Highlight text based on search term
  const highlightText = useCallback((text: string, query: string): React.ReactNode => {
    if (!query || query.trim() === '') return text;

    try {
      // Escape special regex characters to avoid errors
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${safeQuery})`, 'gi'));
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase()
          ? <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white">{part}</span>
          : part
      );
    } catch (e) {
      return text;
    }
  }, []);

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-1.5 px-3 pl-8 text-sm';
      case 'lg':
        return 'py-3 px-5 pl-12 text-lg';
      case 'md':
      default:
        return 'py-2 px-4 pl-10 text-base';
    }
  };

  // Get icon size classes
  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 left-2.5';
      case 'lg':
        return 'h-6 w-6 left-4';
      case 'md':
      default:
        return 'h-5 w-5 left-3';
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearch} className="flex w-full">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={`w-full ${getSizeClasses()} rounded-l-xl border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
            value={inputValue}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            aria-label="Search input"
            disabled={isSearching}
          />
          <div className={`absolute ${getIconSizeClasses()} top-1/2 transform -translate-y-1/2 text-base-content/70`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Clear button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/70 hover:text-base-content p-1 rounded-full hover:bg-base-200 transition-colors"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Suggestions dropdown */}
          {withSuggestions && showSuggestions && (inputValue.length > 0 || recentSearches.length > 0) && (
            <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-base-100 rounded-lg shadow-lg border border-base-300 max-h-60 overflow-auto">
              {inputValue.length > 0 && (
                <div className="p-2">
                  <div className="text-sm font-medium text-base-content/70 px-3 py-1.5 flex justify-between items-center">
                    <span>Gợi ý từ khóa</span>
                    {isLoadingSuggestions && (
                      <span className="loading loading-spinner loading-xs text-primary"></span>
                    )}
                  </div>
                  {!isLoadingSuggestions ? suggestions.length > 0 ? (
                    <>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-base-200 rounded-lg flex items-center cursor-pointer"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          {highlightText(suggestion, inputValue)}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-base-content/50">
                      Không có gợi ý nào
                    </div>
                  ) : null}
                </div>
              )}
              
              {recentSearches.length > 0 && (
                <div className={`p-2 ${inputValue.length > 0 && suggestions.length > 0 ? 'border-t border-base-300' : ''}`}>
                  <div className="text-sm font-medium text-base-content/70 px-3 py-1.5 flex justify-between items-center">
                    <span>Tìm kiếm gần đây</span>
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.setItem('recentSearches', JSON.stringify([]));
                        }}
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-base-200 rounded-lg flex items-center justify-between group cursor-pointer"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {inputValue ? highlightText(search, inputValue) : search}
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-base-300 rounded-full transition-opacity"
                        onClick={(e) => handleRemoveSavedSearch(e, search)}
                        aria-label="Remove search term"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`bg-primary hover:bg-primary-focus text-primary-content rounded-r-xl transition-colors ${
            size === 'sm' ? 'px-3' : size === 'lg' ? 'px-8' : 'px-6'
          } flex items-center justify-center min-w-[80px]`}
          disabled={isSearching}
        >
          {isSearching ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            'Tìm kiếm'
          )}
        </button>
      </form>
    </div>
  );
});

SearchField.displayName = 'SearchField';

export default SearchField; 