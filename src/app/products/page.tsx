'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Image from 'next/image';
import { useCategories } from '@/context/CategoriesContext';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  brand?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  reviews?: { rating: number }[];
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State cho dữ liệu và loading
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategories();
  const [brands, setBrands] = useState<string[]>([]);

  // State cho bộ lọc và sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20); // 20 sản phẩm mỗi trang



  // Đọc các tham số từ URL khi trang tải
  useEffect(() => {
    if (!searchParams) return;

    console.log('=== URL PARAMS SYNC ===');
    console.log('Current URL params:', Object.fromEntries(searchParams.entries()));

    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating') as string) : null;
    const brand = searchParams.get('brand') || null;

    // Đọc giá từ URL
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') as string) : 0;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') as string) : 0;

    // Kiểm tra nếu chỉ có category và page trong URL (từ header navigation)
    const urlParams = Object.fromEntries(searchParams.entries());
    const hasOnlyCategoryAndPage = Object.keys(urlParams).length <= 2 &&
                                   (urlParams.category || Object.keys(urlParams).length === 0) &&
                                   (!urlParams.minPrice && !urlParams.maxPrice && !urlParams.rating && !urlParams.brand && !urlParams.search);

    console.log('Setting state from URL:', {
      page, category, sort, search, rating, brand, minPrice, maxPrice, hasOnlyCategoryAndPage
    });

    // Nếu chỉ có category và page, reset các filter khác
    if (hasOnlyCategoryAndPage) {
      setPriceRange([0, 0]);
      setRatingFilter(null);
      setSelectedBrand(null);
      setSearchTerm('');
      setSortBy('newest');
    } else {
      setPriceRange([minPrice, maxPrice]);
      setRatingFilter(rating);
      setSelectedBrand(brand);
      setSearchTerm(search);
      setSortBy(sort);
    }

    setCurrentPage(page);
    setSelectedCategory(category);

    console.log('=== END URL PARAMS SYNC ===');
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy filter trực tiếp từ URL (searchParams)
      const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
      const category = searchParams.get('category');
      const sort = searchParams.get('sort') || 'newest';
      const search = searchParams.get('search') || '';
      const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating') as string) : null;
      const brand = searchParams.get('brand') || null;
      const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') as string) : 0;
      const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') as string) : 0;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : itemsPerPage;

      // Xây dựng query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      let sortParam = 'newest';
      switch (sort) {
        case 'price_asc': sortParam = 'price_asc'; break;
        case 'price_desc': sortParam = 'price_desc'; break;
        case 'popular': sortParam = 'popular'; break;
        default: sortParam = 'newest';
      }
      params.append('sort', sortParam);
      if (minPrice > 0) params.append('minPrice', minPrice.toString());
      if (maxPrice > 0) params.append('maxPrice', maxPrice.toString());
      if (rating) params.append('rating', rating.toString());
      if (brand) params.append('brand', brand);

      console.log('=== API REQUEST DEBUG ===');
      console.log('Current state:', {
        currentPage, selectedCategory, sortBy, searchTerm,
        priceRange, ratingFilter, selectedBrand, itemsPerPage
      });
      console.log('API request params:', params.toString());
      console.log('=== END API REQUEST DEBUG ===');



      // API đã hỗ trợ lọc theo giá, thương hiệu và đánh giá
      // Tất cả lọc được thực hiện ở phía server

      // Implement retry logic for the main products API
      let response;
      let retries = 3;

      while (retries > 0) {
        try {
          response = await axios.get(`/api/products?${params.toString()}`);
          break; // If successful, break out of the retry loop
        } catch (err) {
          retries--;
          if (retries === 0) {
            // If out of retries, re-throw the error
            throw err;
          }
          console.log(`Retrying... ${retries} attempts left`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!response) {
        throw new Error('Failed to fetch products after multiple attempts');
      }

      // Lấy thông tin phân trang từ headers
      const totalCount = parseInt(response.headers['x-total-count'] || '0');
      const totalPages = parseInt(response.headers['x-total-pages'] || '1');

      setTotalProducts(totalCount);
      setTotalPages(totalPages);

      // Đảm bảo dữ liệu nhận được là một mảng sản phẩm
      let data = response.data;
      console.log('=== FRONTEND DEBUG ===');
      console.log('Raw response data:', data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Is array?', Array.isArray(data));
      console.log('Data type:', typeof data);
      console.log('Data length (if array):', Array.isArray(data) ? data.length : 'N/A');
      console.log('Has products property?', data && Array.isArray(data.products));
      console.log('=== END FRONTEND DEBUG ===');

      if (Array.isArray(data)) {
        console.log('Processing array data, length:', data.length);
        // API đã xử lý tất cả lọc - sử dụng kết quả trực tiếp từ API
        console.log('Using API filtered results directly');
        console.log('Products from API:', data.length);

        // Log product details for debugging
        data.forEach((product, index) => {
          console.log(`Product ${index + 1}:`, {
            name: product.name,
            price: product.price,
            category: product.category?.name || 'No category'
          });
        });

        console.log('Filtered data length:', data.length);
        console.log('About to set products state with data:', data);
        setProducts(data);
        console.log('Products state set successfully');
      } else if (data && Array.isArray(data.products)) {
        // Trường hợp API trả về dạng { products: [...] }
        console.log('Processing data.products, length:', data.products.length);
        setProducts(data.products);
      } else {
        console.error('Định dạng dữ liệu sản phẩm không đúng:', data);
        setProducts([]);
        setError('Định dạng dữ liệu sản phẩm không đúng');
      }

      setError(null);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);

      // More detailed error reporting
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', err.response.status, err.response.data);
        setError(`Lỗi máy chủ (${err.response.status}): ${err.response.data?.error || 'Không thể tải sản phẩm'}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Request error - no response:', err.request);
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', err.message);
        setError(`Lỗi: ${err.message}`);
      }

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage]);

  // Fetch dữ liệu sản phẩm mỗi khi bộ lọc thay đổi
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Lấy danh sách thương hiệu từ sản phẩm
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get('/api/products/brands');
        if (response.data && Array.isArray(response.data)) {
          setBrands(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thương hiệu:', error);
        // Fallback: trích xuất brands từ tên sản phẩm hiện có
        if (products.length > 0) {
          const extractedBrands = products.map(product => {
            const name = product.name.toLowerCase();
            if (name.includes('iphone') || name.includes('apple') || name.includes('macbook') || name.includes('ipad')) return 'Apple';
            if (name.includes('samsung') || name.includes('galaxy')) return 'Samsung';
            if (name.includes('xiaomi') || name.includes('redmi')) return 'Xiaomi';
            if (name.includes('dell')) return 'Dell';
            if (name.includes('sony')) return 'Sony';
            if (name.includes('asus')) return 'ASUS';
            if (name.includes('hp')) return 'HP';
            if (name.includes('lenovo')) return 'Lenovo';
            if (name.includes('acer')) return 'Acer';
            if (name.includes('msi')) return 'MSI';
            if (name.includes('lg')) return 'LG';
            if (name.includes('huawei')) return 'Huawei';
            if (name.includes('oppo')) return 'OPPO';
            if (name.includes('vivo')) return 'Vivo';
            if (name.includes('realme')) return 'Realme';
            if (name.includes('oneplus')) return 'OnePlus';
            if (name.includes('google') || name.includes('pixel')) return 'Google';
            if (name.includes('microsoft') || name.includes('surface')) return 'Microsoft';
            if (name.includes('nintendo')) return 'Nintendo';
            if (name.includes('playstation') || name.includes('ps5')) return 'Sony PlayStation';
            if (name.includes('xbox')) return 'Microsoft Xbox';
            return null;
          }).filter(Boolean);

          const uniqueBrands = Array.from(new Set(extractedBrands)) as string[];
          setBrands(uniqueBrands);
        }
      }
    };

    fetchBrands();
  }, [products]);

  // Cập nhật URL với các tham số lọc
  const updateFiltersInURL = useCallback((filters: Record<string, any>) => {
    if (!searchParams) return;

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    // Cập nhật các tham số
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    // Luôn quay về trang 1 khi thay đổi bộ lọc
    if (!filters.hasOwnProperty('page')) {
      current.set('page', '1');
    }

    // Cập nhật URL
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/products${query}`);
  }, [searchParams, router]);

  // Xử lý thay đổi bộ lọc
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    updateFiltersInURL({
      category: categoryId
    });
  }, [updateFiltersInURL]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    updateFiltersInURL({ sort });
  }, [updateFiltersInURL]);

  const handlePriceRangeChange = useCallback((minPrice: number, maxPrice: number) => {
    setPriceRange([minPrice, maxPrice]);
    updateFiltersInURL({
      minPrice: minPrice > 0 ? minPrice : null,
      maxPrice: maxPrice > 0 ? maxPrice : null
    });
  }, [updateFiltersInURL]);





  const handleRatingFilterChange = useCallback((rating: number | null) => {
    setRatingFilter(rating);
    updateFiltersInURL({ rating });
  }, [updateFiltersInURL]);

  const handleBrandChange = useCallback((brand: string | null) => {
    setSelectedBrand(brand);
    updateFiltersInURL({ brand });
  }, [updateFiltersInURL]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateFiltersInURL({ page });
  }, [updateFiltersInURL]);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset về trang 1
    updateFiltersInURL({ limit: items, page: 1 });
  }, [updateFiltersInURL]);

  // Reset tất cả bộ lọc
  const resetAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSortBy('newest');
    setSearchTerm('');
    setPriceRange([0, 0]);
    setRatingFilter(null);
    setSelectedBrand(null);
    setCurrentPage(1);
    router.push('/products');
  }, [router]);

  // Hiển thị UI khi đang tải
  if (loading && currentPage === 1) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tất cả sản phẩm</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card bg-base-100 shadow-sm animate-pulse h-full flex flex-col">
              <div className="h-48 bg-gray-200 rounded-t-lg flex-shrink-0"></div>
              <div className="card-body flex-grow flex flex-col">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-4"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tất cả sản phẩm</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar filters */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">Lọc sản phẩm</h2>
              <button
                onClick={() => console.clear()}
                className="btn btn-xs btn-ghost"
                title="Clear console logs"
              >
                🧹
              </button>
            </div>

            {/* Danh mục */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Danh mục</h3>
              <div className="space-y-1">
                <div className="form-control">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm radio-primary"
                      checked={selectedCategory === null}
                      onChange={() => handleCategoryChange(null)}
                    />
                    <span className={`ml-2 ${selectedCategory === null ? 'font-bold text-primary' : ''}`}>Tất cả</span>
                  </label>
                </div>

                {Array.isArray(categories) && categories.map(category => (
                  <div key={category.id} className="form-control">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        className="radio radio-sm radio-primary"
                        checked={selectedCategory === category.id}
                        onChange={() => handleCategoryChange(category.id)}
                      />
                      <span className={`ml-2 ${selectedCategory === category.id ? 'font-bold text-primary' : ''}`}>{category.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Khoảng giá</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      className="input input-bordered w-full text-sm"
                      placeholder="Giá từ"
                      value={priceRange[0] || ''}
                      onChange={(e) => {
                        const minPrice = parseInt(e.target.value) || 0;
                        handlePriceRangeChange(minPrice, priceRange[1]);
                      }}
                      min="0"
                      step="10000"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="input input-bordered w-full text-sm"
                      placeholder="Giá đến"
                      value={priceRange[1] || ''}
                      onChange={(e) => {
                        const maxPrice = parseInt(e.target.value) || 0;
                        handlePriceRangeChange(priceRange[0], maxPrice);
                      }}
                      min="0"
                      step="10000"
                    />
                  </div>
                </div>

                {/* Các mức giá phổ biến */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`btn btn-sm ${priceRange[0] === 0 && priceRange[1] === 500000 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePriceRangeChange(0, 500000)}
                  >
                    Dưới 500k
                  </button>
                  <button
                    className={`btn btn-sm ${priceRange[0] === 500000 && priceRange[1] === 1000000 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePriceRangeChange(500000, 1000000)}
                  >
                    500k - 1tr
                  </button>
                  <button
                    className={`btn btn-sm ${priceRange[0] === 1000000 && priceRange[1] === 2000000 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePriceRangeChange(1000000, 2000000)}
                  >
                    1tr - 2tr
                  </button>
                  <button
                    className={`btn btn-sm ${priceRange[0] === 2000000 && priceRange[1] === 0 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePriceRangeChange(2000000, 0)}
                  >
                    Trên 2tr
                  </button>
                </div>
              </div>
            </div>





            {/* Đánh giá */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Đánh giá</h3>
              <div className="space-y-2">
                <div className="form-control">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm radio-primary"
                      checked={ratingFilter === null}
                      onChange={() => handleRatingFilterChange(null)}
                    />
                    <span className={`ml-2 ${ratingFilter === null ? 'font-bold text-primary' : ''}`}>Tất cả</span>
                  </label>
                </div>

                {[4, 3, 2, 1].map(rating => (
                  <div key={rating} className="form-control">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        className="radio radio-sm radio-primary"
                        checked={ratingFilter === rating}
                        onChange={() => handleRatingFilterChange(rating)}
                      />
                      <span className={`ml-2 ${ratingFilter === rating ? 'font-bold text-primary' : ''}`}>
                        {rating}★ trở lên
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Thương hiệu */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Thương hiệu</h3>
              <div className="space-y-1">
                <div className="form-control">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm radio-primary"
                      checked={selectedBrand === null}
                      onChange={() => handleBrandChange(null)}
                    />
                    <span className={`ml-2 ${selectedBrand === null ? 'font-bold text-primary' : ''}`}>Tất cả</span>
                  </label>
                </div>

                {Array.isArray(brands) && brands.map(brand => (
                  <div key={brand} className="form-control">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        className="radio radio-sm radio-primary"
                        checked={selectedBrand === brand}
                        onChange={() => handleBrandChange(brand)}
                      />
                      <span className={`ml-2 ${selectedBrand === brand ? 'font-bold text-primary' : ''}`}>{brand}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Reset */}
            <button
              className="btn btn-outline w-full"
              onClick={resetAllFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-4">
          {/* Sort controls */}
          <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-4">
            <div className="flex justify-end">
              <div className="flex gap-2 items-center">
                <span className="whitespace-nowrap">Sắp xếp:</span>
                <select
                  className="select select-bordered"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến cao</option>
                  <option value="price_desc">Giá: Cao đến thấp</option>
                  <option value="popular">Phổ biến nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {(selectedCategory || searchTerm || (priceRange[0] > 0 || priceRange[1] > 0) || ratingFilter || selectedBrand) && (
            <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-4">
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Bộ lọc đang áp dụng:</span>

                {selectedCategory && Array.isArray(categories) && (
                  <div className="badge badge-primary gap-1">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Danh mục'}
                    <button onClick={() => handleCategoryChange(null)}>×</button>
                  </div>
                )}

                {searchTerm && (
                  <div className="badge badge-primary gap-1">
                    Tìm: {searchTerm}
                    <button onClick={() => {
                      setSearchTerm('');
                      updateFiltersInURL({ search: '' });
                    }}>×</button>
                  </div>
                )}

                {(priceRange[0] > 0 || priceRange[1] > 0) && (
                  <div className="badge badge-primary gap-1">
                    {priceRange[0] > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceRange[0]) : '0₫'} -
                    {priceRange[1] > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceRange[1]) : '∞'}
                    <button onClick={() => handlePriceRangeChange(0, 0)}>×</button>
                  </div>
                )}

                {ratingFilter && (
                  <div className="badge badge-primary gap-1">
                    {ratingFilter}★ trở lên
                    <button onClick={() => handleRatingFilterChange(null)}>×</button>
                  </div>
                )}

                {selectedBrand && (
                  <div className="badge badge-primary gap-1">
                    {selectedBrand}
                    <button onClick={() => handleBrandChange(null)}>×</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="bg-base-100 p-8 rounded-lg shadow-sm text-center">
              <h3 className="text-lg font-semibold">Không tìm thấy sản phẩm nào</h3>
              <p className="text-gray-500 mt-2">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>

              {/* Debug info */}
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
                <p><strong>Debug Info:</strong></p>
                <p>Products length: {products.length}</p>
                <p>Loading: {loading.toString()}</p>
                <p>Selected Category: {selectedCategory || 'null'}</p>
                <p>Search Term: {searchTerm || 'empty'}</p>
                <p>Total Products: {totalProducts}</p>
                <p>Error: {error || 'none'}</p>
              </div>

              {(searchTerm || selectedCategory || (priceRange[0] > 0 || priceRange[1] > 0) || ratingFilter || selectedBrand) && (
                <button
                  className="btn btn-outline mt-4"
                  onClick={resetAllFilters}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-2 text-sm text-gray-500">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalProducts)} trên {totalProducts} sản phẩm
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <figure className="h-48 overflow-hidden flex-shrink-0">
                      <Image
                        width={300}
                        height={200}
                        src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={product.name}
                        className="h-48 object-cover w-full rounded-t-lg"
                      />
                    </figure>
                    <div className="card-body flex-grow flex flex-col">
                      <h2 className="card-title text-lg line-clamp-2 min-h-[3.5rem]">{product.name}</h2>
                      <div className="flex gap-2 mb-2">
                        <div className="badge badge-secondary">{product.category.name}</div>
                        {product.brand && (
                          <div className="badge badge-secondary badge-outline">{product.brand}</div>
                        )}
                      </div>
                      <p className="text-primary font-bold mt-auto">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                      </p>
                      <div className="card-actions justify-end mt-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalProducts > 0 && (
            <div className="flex justify-between items-center mt-8">
              <div className="flex items-center gap-2">
                <span>Hiển thị:</span>
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                >
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="60">60</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div className="join">
                <button
                  className="join-item btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  «
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Tính toán trang hiển thị để luôn hiển thị 5 trang xung quanh trang hiện tại
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageToShow}
                      className={`join-item btn ${currentPage === pageToShow ? 'btn-active' : ''}`}
                      onClick={() => handlePageChange(pageToShow)}
                    >
                      {pageToShow}
                    </button>
                  );
                })}

                <button
                  className="join-item btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}