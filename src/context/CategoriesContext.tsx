'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Định nghĩa interface cho Category
interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  parentCategory?: Category;
  subCategories?: Category[];
  _count?: {
    products: number;
    subCategories?: number;
  };
}

// Định nghĩa interface cho Context
interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  featuredCategories: Category[];
  parentCategories: Category[];
  getCategoryById: (id: string) => Category | undefined;
  getCategoriesByParent: (parentId: string | null) => Category[];
}

// Tạo Context
const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

// Hook để sử dụng Context
export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

// Props cho Provider
interface CategoriesProviderProps {
  children: ReactNode;
}

// Provider Component
export const CategoriesProvider: React.FC<CategoriesProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm fetch categories từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories?includeStructure=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sắp xếp categories theo sortOrder và lọc bỏ danh mục "an" và "Asuna"
      const sortedCategories = data
        .filter((category: Category) =>
          category.name !== 'an' && category.name !== 'Asuna'
        )
        .sort((a: Category, b: Category) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      setCategories(sortedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Hàm refresh categories (public API)
  const refreshCategories = async () => {
    await fetchCategories();
  };

  // Fetch categories khi component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Lắng nghe event để refresh categories khi có thay đổi từ admin
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      console.log('Categories updated event received, refreshing...');
      refreshCategories();
    };

    // Lắng nghe custom event
    window.addEventListener('categories-updated', handleCategoriesUpdate);
    
    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, []);

  // Computed values
  const featuredCategories = categories.filter(cat => cat.isFeatured);
  const parentCategories = categories.filter(cat => !cat.parentId);

  // Helper functions
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  const getCategoriesByParent = (parentId: string | null): Category[] => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const contextValue: CategoriesContextType = {
    categories,
    loading,
    error,
    refreshCategories,
    featuredCategories,
    parentCategories,
    getCategoryById,
    getCategoriesByParent,
  };

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
};

// Utility function để trigger event update categories
export const triggerCategoriesUpdate = () => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('categories-updated');
    window.dispatchEvent(event);
  }
};
