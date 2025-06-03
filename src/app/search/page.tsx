'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

// Types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(query);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    if (typeof window !== 'undefined') {
      const searches = localStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    }
  };

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (query.trim() === '') return;

    let searches = [...recentSearches];
    searches = searches.filter(s => s !== query);
    searches.unshift(query);
    searches = searches.slice(0, 5);

    setRecentSearches(searches);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  };

  // Search products
  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm sản phẩm');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveSearch(searchTerm.trim());
      const params = new URLSearchParams();
      params.set('q', searchTerm.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    saveSearch(suggestion);
    const params = new URLSearchParams();
    params.set('q', suggestion);
    router.push(`/search?${params.toString()}`);
  };

  // Fetch all data on initial load
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (query) {
      searchProducts(query);
    }
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Tìm kiếm sản phẩm</h1>
        
        <div className="bg-base-100 p-6 rounded-xl shadow-sm mb-6">
          <form onSubmit={handleSearch} className="flex w-full mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full py-3 px-5 pl-12 text-lg rounded-l-xl border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
              <div className="absolute h-6 w-6 left-4 top-1/2 transform -translate-y-1/2 text-base-content/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-primary-content rounded-r-xl transition-colors px-8 flex items-center justify-center min-w-[120px]"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      {!query ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Bạn đang tìm gì?</h2>
          <p className="mb-8 text-base-content/70 max-w-xl mx-auto">
            Nhập từ khóa vào ô tìm kiếm để bắt đầu tìm kiếm sản phẩm mà bạn mong muốn.
          </p>

          {recentSearches.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium mb-4">Tìm kiếm gần đây</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSuggestionClick(search)}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link href="/products" className="btn btn-primary">
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Kết quả tìm kiếm</h2>
            <p className="text-base-content/70">
              Từ khóa tìm kiếm: <span className="font-medium">"{query}"</span>
            </p>
          </div>

          {error && (
            <div className="alert alert-error shadow-lg mb-6">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : products.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium">Không tìm thấy sản phẩm nào</h3>
                <p className="text-base-content/70">Hãy thử tìm kiếm với từ khóa khác</p>
                <Link href="/products" className="btn btn-primary mt-2">
                  Xem tất cả sản phẩm
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-base-content/70">
                  Tìm thấy {products.length} sản phẩm
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
