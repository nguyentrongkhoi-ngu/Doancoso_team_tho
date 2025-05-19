'use client';

import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamic import cho ApiConnectionTest component
const ApiConnectionTest = dynamic(() => import('@/components/admin/ApiConnectionTest'), {
  ssr: false,
  loading: () => <div className="p-4 mb-6 bg-blue-50 rounded-lg">Đang tải công cụ kiểm tra API...</div>
});

// Dynamic import cho FixSchemaButton component
const FixSchemaButton = dynamic(() => import('@/components/admin/FixSchemaButton'), {
  ssr: false
});

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: {
    name: string;
  };
  createdAt: string;
  isFeatured: boolean;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'notFeatured'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Lọc sản phẩm theo trạng thái nổi bật
  useEffect(() => {
    if (featuredFilter === 'all') {
      setFilteredProducts(products);
    } else if (featuredFilter === 'featured') {
      setFilteredProducts(products.filter(product => Boolean(product.isFeatured)));
    } else {
      setFilteredProducts(products.filter(product => !Boolean(product.isFeatured)));
    }
  }, [products, featuredFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/products');
      
      // Kiểm tra xem có dữ liệu products trả về không
      if (response.data && Array.isArray(response.data)) {
        // Đảm bảo isFeatured luôn là boolean
        const productsWithValidFeatured = response.data.map(product => ({
          ...product,
          isFeatured: Boolean(product.isFeatured)
        }));
        setProducts(productsWithValidFeatured);
      } else if (response.data && Array.isArray(response.data.products)) {
        // Đảm bảo isFeatured luôn là boolean
        const productsWithValidFeatured = response.data.products.map(product => ({
          ...product,
          isFeatured: Boolean(product.isFeatured)
        }));
        setProducts(productsWithValidFeatured);
      } else {
        console.warn('Dữ liệu API không đúng cấu trúc mong đợi:', response.data);
        setProducts([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteProductId(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteProductId) return;
    
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/admin/products/${deleteProductId}`);
      
      // Cập nhật lại danh sách sản phẩm
      setProducts(products.filter(product => product.id !== deleteProductId));
      
      toast.success('Đã xóa sản phẩm thành công');
      setShowDeleteConfirm(false);
      setDeleteProductId(null);
    } catch (err: any) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      
      // Hiển thị thông báo lỗi cụ thể từ phản hồi API
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        toast.error(err.response.data.error);
      } else {
        setError('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
        toast.error('Không thể xóa sản phẩm');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteProductId(null);
  };

  const toggleFeatured = async (productId: string, currentStatus: boolean) => {
    // Convert to boolean to ensure consistent types
    const isCurrentlyFeatured = Boolean(currentStatus);
    
    try {
      console.log(`Attempting to toggle featured status for product ${productId}. Current status: ${isCurrentlyFeatured}, New status: ${!isCurrentlyFeatured}`);
      
      // Cập nhật UI trước để trải nghiệm người dùng tốt hơn
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, isFeatured: !isCurrentlyFeatured } : product
        )
      );

      // Gọi API chính thức để toggle trạng thái nổi bật với retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      // Đảm bảo URL API đúng
      const apiUrl = '/api/admin/products/toggle-featured';
      console.log(`Using API URL: ${apiUrl}`);
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to toggle featured status`);
          
          // Check if session is still valid before making request
          const session = await fetch('/api/auth/session');
          if (!session.ok) {
            throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng tải lại trang và đăng nhập lại.');
          }
          
          // Sử dụng fetch thay vì axios
          const fetchResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              productId,
              isFeatured: !isCurrentlyFeatured
            })
          });
          
          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => ({}));
            throw new Error(`HTTP error ${fetchResponse.status}: ${fetchResponse.statusText}. Details: ${JSON.stringify(errorData)}`);
          }
          
          const responseData = await fetchResponse.json();
          response = { data: responseData, status: fetchResponse.status };
          
          console.log('Response received:', response);
          break; // Thoát khỏi vòng lặp nếu thành công
        } catch (err: any) {
          console.error(`Attempt ${retryCount + 1} failed:`, err);
          
          // Kiểm tra lỗi mạng
          if (err.message && err.message.includes('Network Error')) {
            toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.');
            throw err;
          }
          
          // Kiểm tra lỗi hết phiên đăng nhập
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
            throw err;
          }
          
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Thông báo đang thử lại
            toast.loading(`Đang thử lại lần ${retryCount}...`, {
              duration: 1000
            });
            await new Promise(resolve => setTimeout(resolve, 1500)); // Đợi 1.5 giây trước khi thử lại
          } else {
            throw err; // Ném lỗi nếu đã vượt quá số lần thử lại
          }
        }
      }
      
      if (!response || response.status !== 200) {
        throw new Error(`Không thành công: ${response?.status}`);
      }

      // Thông báo thành công
      const status = !isCurrentlyFeatured ? "nổi bật" : "không nổi bật";
      console.log(`Đã cập nhật sản phẩm thành ${status}`);
      toast.success(response.data.message || `Đã cập nhật sản phẩm thành ${status}`);
      
      // Đảm bảo trạng thái UI phản ánh dữ liệu từ server
      if (response.data.product) {
        setProducts(
          products.map((product) =>
            product.id === productId ? { ...product, isFeatured: response.data.product.isFeatured } : product
          )
        );
      }
      
      // Làm mới dữ liệu sau khi cập nhật
      setTimeout(() => {
        fetchProducts();
      }, 1000);
    } catch (err: any) {
      console.error("Lỗi khi cập nhật trạng thái sản phẩm nổi bật:", err);
      
      // Log detailed error information
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
        
        // Xử lý các mã lỗi cụ thể từ server
        if (err.response.status === 404) {
          toast.error('Không tìm thấy API endpoint hoặc sản phẩm. Kiểm tra định tuyến API hoặc sản phẩm có thể đã bị xóa.');
        } else if (err.response.status === 403) {
          toast.error('Bạn không có quyền thực hiện thao tác này.');
        } else if (err.response.status === 400) {
          toast.error(err.response.data.error || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        } else if (err.response.status === 500) {
          toast.error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        toast.error('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", err.message);
        toast.error(err.message || 'Đã xảy ra lỗi không xác định.');
      }
      
      // Khôi phục lại trạng thái ban đầu trong UI nếu API gặp lỗi
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, isFeatured: isCurrentlyFeatured } : product
        )
      );
      
      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details ||
                          err.message ||
                          "Không thể cập nhật trạng thái sản phẩm nổi bật. Vui lòng thử lại sau.";
      setError(errorMessage);
      
      // Đã hiển thị toast ở trên, không cần hiển thị lại
      if (!err.response) {
        toast.error(errorMessage);
      }
      
      setTimeout(() => setError(null), 5000);
      
      // Thử tải lại danh sách sản phẩm để đảm bảo trạng thái mới nhất
      setTimeout(() => {
        fetchProducts();
      }, 2000);
    }
  };

  // Ensure that formatPrice is safe and won't throw errors
  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Ensure that formatDate is safe and won't throw errors
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản Lý Sản Phẩm</h1>
          <div className="flex space-x-2">
            <FixSchemaButton />
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
              onClick={() => router.push('/admin/products/new')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Thêm Sản Phẩm
            </button>
          </div>
        </div>

        {/* Thêm component kiểm tra kết nối API */}
        {error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-semibold">Lỗi: {error}</p>
            
            {/* Hiển thị giải pháp cụ thể nếu là lỗi isFeatured */}
            {error.includes('isFeatured') && (
              <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-yellow-800 mb-2">
                  <strong>Phát hiện lỗi schema database:</strong> Trường <code className="bg-yellow-100 px-1 rounded">isFeatured</code> không tồn tại trong bảng Product.
                </p>
                <p className="text-yellow-800 mb-4">Để sửa lỗi này, hãy nhấn nút "Sửa chữa schema database" ở góc trên bên phải hoặc nút bên dưới:</p>
                <div className="flex justify-center">
                  <FixSchemaButton />
                </div>
              </div>
            )}
            
            {/* Hiển thị nút kiểm tra API nếu có lỗi */}
            <div className="mt-2">
              <button
                onClick={() => import('@/components/admin/ApiConnectionTest').then(mod => mod.default)}
                className="text-red-700 font-medium underline"
              >
                Kiểm tra kết nối API
              </button>
            </div>
          </div>
        ) : (
          <ApiConnectionTest />
        )}
        
        {/* Bộ lọc sản phẩm nổi bật */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center">
          <div className="flex items-center mb-3 md:mb-0">
            <span className="mr-3 text-gray-600 font-medium">Lọc sản phẩm:</span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setFeaturedFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${featuredFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setFeaturedFilter('featured')}
                className={`px-4 py-2 rounded-lg font-medium ${featuredFilter === 'featured' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Nổi bật
              </button>
              <button 
                onClick={() => setFeaturedFilter('notFeatured')}
                className={`px-4 py-2 rounded-lg font-medium ${featuredFilter === 'notFeatured' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Không nổi bật
              </button>
            </div>
          </div>
          <div className="ml-0 md:ml-auto text-sm text-gray-600">
            Hiển thị {filteredProducts.length} / {products.length} sản phẩm
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded text-center">
            <p className="text-gray-600 mb-4">Không có sản phẩm nào.</p>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => router.push('/admin/products/new')}
            >
              Thêm Sản Phẩm Đầu Tiên
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded text-center">
            <p className="text-gray-600 mb-4">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setFeaturedFilter('all')}
            >
              Hiển thị tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tên Sản Phẩm
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Danh Mục
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tồn Kho
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ngày Tạo
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nổi Bật
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  // Ensure we have a valid product with defined isFeatured property
                  const isFeatured = Boolean(product?.isFeatured);
                  
                  return (
                    <tr key={product.id}>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div className="flex items-center">
                          <div className="ml-3">
                            <p className="text-gray-900 whitespace-nowrap">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap">{product.category?.name || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap">{formatPrice(product.price)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap">{product.stock}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap">{formatDate(product.createdAt)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm flex justify-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id={`toggle-${product.id}`}
                            checked={isFeatured}
                            onChange={() => toggleFeatured(product.id, isFeatured)}
                            className="sr-only peer"
                          />
                          <label 
                            htmlFor={`toggle-${product.id}`}
                            className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-blue-500 transition-colors duration-300"
                          >
                            <span className={`absolute left-0 top-0 block h-6 w-6 rounded-full bg-white border border-gray-300 shadow transform transition-transform duration-300 ${isFeatured ? 'translate-x-4' : 'translate-x-0'}`}></span>
                          </label>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Xem
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa sản phẩm</h3>
            <p className="mb-6">Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 