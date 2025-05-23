'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import AvatarPlaceholder from './AvatarPlaceholder';
import { isValidURL, customImageLoader } from '@/lib/imageLoader';
import SearchField from './SearchField';
import { ShoppingBag, Search, X, ChevronDown, Sun, Moon } from 'lucide-react';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchContext } from '@/context/SearchContext';
import { useTheme } from '@/context/ThemeProvider';
import axios from 'axios';

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { searchTerm, clearSearch, isSearching, executeSearch } = useSearchContext();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const miniCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Thêm hiệu ứng thay đổi header khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Xử lý hiển thị mini cart với delay để tránh đóng ngay khi di chuyển chuột
  const handleCartMouseEnter = () => {
    if (miniCartTimeoutRef.current) {
      clearTimeout(miniCartTimeoutRef.current);
      miniCartTimeoutRef.current = null;
    }
    setIsMiniCartOpen(true);
  };

  const handleCartMouseLeave = () => {
    miniCartTimeoutRef.current = setTimeout(() => {
      setIsMiniCartOpen(false);
    }, 300);
  };

  const handleMiniCartMouseEnter = () => {
    if (miniCartTimeoutRef.current) {
      clearTimeout(miniCartTimeoutRef.current);
      miniCartTimeoutRef.current = null;
    }
  };

  const handleMiniCartMouseLeave = () => {
    miniCartTimeoutRef.current = setTimeout(() => {
      setIsMiniCartOpen(false);
    }, 300);
  };

  // Kiểm tra xem một đường dẫn có đang được active không
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  // Xử lý sự kiện click bên ngoài thanh tìm kiếm
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        isSearchExpanded
      ) {
        // Đóng thanh tìm kiếm mở rộng nếu không có từ khóa tìm kiếm
        if (!searchTerm) {
          setIsSearchExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded, searchTerm]);

  // Mở rộng ô tìm kiếm khi click vào icon
  const toggleSearchExpand = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  // Xử lý khi nhấn nút xóa tìm kiếm
  const handleClearSearch = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  // Lấy danh sách danh mục
  const fetchCategories = useCallback(async () => {
    if (categories.length > 0) return; // Đã có dữ liệu rồi

    try {
      setLoadingCategories(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, [categories.length]);

  // Xử lý khi hover vào nút danh mục
  const handleCategoryMouseEnter = () => {
    fetchCategories();
    setIsCategoryMenuOpen(true);
  };

  // Xử lý khi hover ra khỏi nút danh mục
  const handleCategoryMouseLeave = () => {
    // Sử dụng timeout để tránh đóng menu ngay lập tức
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current);
    }
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setIsCategoryMenuOpen(false);
    }, 300); // Thời gian trễ dài hơn để người dùng có thể di chuột xuống menu
  };

  // Xử lý khi di chuột vào dropdown menu
  const handleCategoryMenuMouseEnter = () => {
    // Hủy timeout đóng menu nếu có
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current);
    }
  };

  // Xử lý khi click vào nút danh mục
  const handleCategoryButtonClick = () => {
    fetchCategories();
    setIsCategoryMenuOpen(!isCategoryMenuOpen);
  };

  // Xử lý khi chọn danh mục
  const handleCategoryClick = (categoryId: string) => {
    console.log('handleCategoryClick called with categoryId:', categoryId);
    setIsCategoryMenuOpen(false);

    // Luôn chuyển hướng đến trang products với tham số category
    // Sử dụng router.push để đảm bảo trang được tải lại hoàn toàn
    router.push(`/products?category=${encodeURIComponent(categoryId)}&page=1`);

    // Log để debug
    console.log(`Redirecting to /products?category=${encodeURIComponent(categoryId)}&page=1`);
  };

  // Xử lý click bên ngoài dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Dọn dẹp timeout khi component unmount
      if (categoryMenuTimeoutRef.current) {
        clearTimeout(categoryMenuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-base-100/95 backdrop-blur-md shadow-md py-2' : 'bg-base-100 py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo và Menu Mobile */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
                E-Shop AI
              </span>
            </Link>

            {/* Menu Desktop */}
            <nav className="hidden md:flex ml-10 space-x-1">
              {/* Sản phẩm */}
              <Link
                href="/products"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive('/products')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-base-200'
                }`}
              >
                Sản phẩm
              </Link>

              {/* Danh mục với dropdown */}
              <div
                className="relative"
                ref={categoryMenuRef}
              >
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive('/categories')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-base-200'
                  }`}
                  onClick={handleCategoryButtonClick}
                  onMouseEnter={handleCategoryMouseEnter}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  Danh mục
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu cho danh mục */}
                {isCategoryMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 rounded-xl bg-base-100 shadow-lg ring-1 ring-black/5 z-50"
                    onMouseEnter={handleCategoryMenuMouseEnter}
                    onMouseLeave={handleCategoryMouseLeave}
                  >
                    {/* Vùng kết nối giữa nút và dropdown để dễ di chuột */}
                    <div className="absolute h-2 w-full -top-2"></div>

                    <div className="p-2">
                      {loadingCategories ? (
                        <div className="flex justify-center py-4">
                          <div className="loading loading-spinner loading-sm"></div>
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Không có danh mục nào</div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              className="flex w-full items-center px-4 py-2 text-sm hover:bg-base-200 rounded-lg transition-colors"
                              onClick={() => handleCategoryClick(category.id)}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Giới thiệu */}
              <Link
                href="/about"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive('/about')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-base-200'
                }`}
              >
                Giới thiệu
              </Link>
            </nav>
          </div>

          {/* Tìm kiếm và Actions */}
          <div className="flex items-center gap-2">
            {/* Tìm kiếm Desktop - phiên bản sử dụng SearchContext */}
            <div
              ref={searchContainerRef}
              className={`hidden md:flex items-center transition-all duration-300 ${
                isSearchExpanded ? 'w-96' : 'w-80'
              }`}
            >
              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-9 flex items-center justify-center bg-base-200 rounded-full"
                  >
                    <div className="loading loading-spinner loading-xs"></div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="search-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <SearchField
                      size="sm"
                      className="w-full"
                      placeholder="Tìm kiếm sản phẩm..."
                      autoFocus={isSearchExpanded}
                      withSuggestions={true}
                      onSearch={(term) => {
                        if (term && term.trim() !== '') {
                          executeSearch(term);
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search button for small devices */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-base-200 transition-colors"
              onClick={() => router.push('/search')}
              aria-label="Tìm kiếm"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Nút chuyển đổi theme */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-base-200 transition-colors overflow-hidden"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                <div className="relative w-6 h-6">
                  <Sun
                    className={`absolute h-6 w-6 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'opacity-100 transform rotate-0'
                        : 'opacity-0 transform rotate-90'
                    }`}
                  />
                  <Moon
                    className={`absolute h-6 w-6 transition-all duration-300 ${
                      theme === 'light'
                        ? 'opacity-100 transform rotate-0'
                        : 'opacity-0 transform -rotate-90'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Giỏ hàng */}
            <div
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <Link
                href="/cart"
                className="relative block p-2 rounded-full hover:bg-base-200 transition-colors"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {status === 'authenticated' && (
                <div
                  className="relative"
                  onMouseEnter={handleMiniCartMouseEnter}
                  onMouseLeave={handleMiniCartMouseLeave}
                >
                  <MiniCart
                    isOpen={isMiniCartOpen && cartCount > 0}
                    onClose={() => setIsMiniCartOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Wishlist button - shown when logged in */}
            {status === 'authenticated' && (
              <Link
                href="/profile?tab=wishlist"
                className="btn btn-ghost btn-circle relative"
                aria-label="Yêu thích"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            )}

            {/* Đăng nhập/Tài khoản */}
            {session ? (
              <div className="relative group">
                <button
                  className="flex items-center space-x-1 p-2 rounded-full hover:bg-base-200 transition-colors"
                  aria-label="Tài khoản"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                    {session.user?.image && isValidURL(session.user.image) ? (
                      <Image
                        loader={customImageLoader}
                        src={session.user.image}
                        alt={session.user?.name || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <AvatarPlaceholder />
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>

                {/* Dropdown menu với hiệu ứng */}
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-base-100 shadow-lg ring-1 ring-black/5 transition-all origin-top-right opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible duration-200">
                  <div className="p-2">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium">{session.user?.name || 'Người dùng'}</p>
                      <p className="text-xs text-base-content/70 truncate">{session.user?.email}</p>
                    </div>
                    <div className="h-px bg-base-content/10 my-1"></div>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm hover:bg-base-200 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Hồ sơ
                    </Link>
                    <Link
                      href="/profile/orders"
                      className="flex items-center px-4 py-2 text-sm hover:bg-base-200 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Đơn hàng
                    </Link>
                    {session.user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm hover:bg-base-200 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Quản trị
                      </Link>
                    )}
                    <div className="h-px bg-base-content/10 my-1"></div>
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center px-4 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-4 py-2 border border-primary/20 hover:border-primary rounded-full text-sm font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-focus text-primary-content rounded-full text-sm font-medium transition-colors"
                >
                  <span className="hidden md:inline">Đăng ký</span>
                  <span className="md:hidden">Đăng nhập</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-base-200 transition-colors ml-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="py-2 space-y-1 border-t border-base-content/10">
            <div className="pb-2">
              <SearchField
                size="sm"
                className="w-full"
                placeholder="Tìm kiếm sản phẩm..."
                onSearch={(term) => {
                  if (term) {
                    executeSearch(term);
                    setIsMobileMenuOpen(false);
                  }
                }}
              />
            </div>

            {/* Sản phẩm */}
            <Link
              href="/products"
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive('/products')
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-base-200'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sản phẩm
            </Link>

            {/* Danh mục với dropdown */}
            <div className="px-4 py-1">
              <button
                className={`flex items-center justify-between w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/categories')
                    ? 'bg-primary/10 text-primary'
                    : 'bg-base-200'
                }`}
                onClick={() => {
                  fetchCategories();
                  setIsCategoryMenuOpen(!isCategoryMenuOpen);
                }}
              >
                <span>Danh mục</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown danh mục cho mobile */}
              <div className={`overflow-hidden transition-all duration-300 ${isCategoryMenuOpen ? 'max-h-60 mt-2' : 'max-h-0'}`}>
                {loadingCategories ? (
                  <div className="flex justify-center py-4">
                    <div className="loading loading-spinner loading-sm"></div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Không có danh mục nào</div>
                ) : (
                  <div className="pl-4 space-y-1 max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        className="flex w-full items-center px-4 py-2 text-sm hover:bg-base-200 rounded-lg transition-colors"
                        onClick={() => {
                          handleCategoryClick(category.id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Giới thiệu */}
            <Link
              href="/about"
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-base-200'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Giới thiệu
            </Link>

            {/* Mobile wishlist link - when logged in */}
            {status === 'authenticated' && (
              <Link
                href="/profile?tab=wishlist"
                className="block px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-base-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Yêu thích
                </div>
              </Link>
            )}

            {/* Nút chuyển đổi theme trên mobile */}
            <button
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-base-200"
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-5 w-5 mr-2 text-base-content/70" />
                      Chế độ tối
                    </>
                  ) : (
                    <>
                      <Sun className="h-5 w-5 mr-2 text-base-content/70" />
                      Chế độ sáng
                    </>
                  )}
                </div>
                <div className="relative inline-block w-10 align-middle select-none">
                  <input
                    type="checkbox"
                    name="toggle"
                    id="mobile-theme-toggle"
                    className="sr-only peer"
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                  <label
                    htmlFor="mobile-theme-toggle"
                    className="block h-6 overflow-hidden rounded-full bg-base-300 cursor-pointer peer-checked:bg-primary/20"
                  >
                    <span
                      className={`absolute top-0 left-0 block h-6 w-6 rounded-full transition-all duration-300 transform ${
                        theme === 'dark' ? 'translate-x-4 bg-primary' : 'translate-x-0 bg-base-content/30'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}