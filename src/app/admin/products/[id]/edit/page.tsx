'use client';

import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import React from "react";

type Category = {
  id: string;
  name: string;
};

type Brand = string;

type Product = {
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
  isFeatured: boolean;
};

type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  order: number;
};

// Hàm kiểm tra URL hình ảnh hợp lệ
const isValidImageUrl = (url: string) => {
  // Kiểm tra định dạng URL cơ bản
  try {
    new URL(url);
  } catch (e) {
    return false;
  }
  
  // Kiểm tra đuôi file là hình ảnh thông dụng
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasValidExtension = validExtensions.some(ext => 
    url.toLowerCase().endsWith(ext) || url.toLowerCase().includes(ext + '?')
  );
  
  return hasValidExtension;
};

// Hàm kiểm tra hình ảnh có thể tải được hay không
const checkImageLoads = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout sau 5 giây nếu hình ảnh không tải được
    setTimeout(() => resolve(false), 5000);
  });
};

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // Unwrap params using React.use()
  const { id } = params;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productImages, setProductImages] = useState<{id?: string; url: string; isUploading?: boolean}[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  
  // State cho form chỉnh sửa sản phẩm
  const [productData, setProductData] = useState<{
    id: string;
    name: string;
    description: string;
    price: string;
    stock: string;
    categoryId: string;
    brand: string;
    imageUrl: string;
    isFeatured: boolean;
  }>({
    id: id,
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    brand: '',
    imageUrl: '',
    isFeatured: false
  });

  // Lấy danh sách danh mục và thông tin sản phẩm
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Lấy danh sách danh mục
        const categoriesResponse = await axios.get('/api/categories');

        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        } else if (categoriesResponse.data && categoriesResponse.data.categories) {
          setCategories(categoriesResponse.data.categories);
        } else {
          console.warn('Dữ liệu API danh mục không đúng cấu trúc mong đợi:', categoriesResponse.data);
          setCategories([]);
        }

        // Lấy danh sách thương hiệu
        const brandsResponse = await axios.get('/api/products/brands');
        if (brandsResponse.data && Array.isArray(brandsResponse.data)) {
          setBrands(brandsResponse.data);
        }
        
        // Lấy thông tin sản phẩm theo ID
        const productResponse = await axios.get(`/api/admin/products/${id}`);
        const product = productResponse.data;
        
        // Lấy danh sách hình ảnh của sản phẩm
        const imagesResponse = await axios.get(`/api/products/${id}/images`);
        const images = imagesResponse.data || [];
        
        // Cập nhật state từ dữ liệu API
        setProductData({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price.toString(),
          stock: product.stock.toString(),
          categoryId: product.categoryId,
          brand: product.brand || '',
          imageUrl: product.imageUrl || '',
          isFeatured: product.isFeatured || false
        });
        
        // Cập nhật danh sách hình ảnh
        const formattedImages = images.map((img: ProductImage) => ({
          id: img.id,
          url: img.imageUrl
        }));
        
        // Thêm ảnh chính vào đầu danh sách nếu không có trong images
        if (product.imageUrl && !images.some((img: ProductImage) => img.imageUrl === product.imageUrl)) {
          formattedImages.unshift({
            url: product.imageUrl
          });
        }
        
        setProductImages(formattedImages);
        
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Không thể tải thông tin sản phẩm');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Thêm một placeholder cho hình ảnh đang được tải lên
      const tempImageIndex = productImages.length;
      setProductImages(prev => [...prev, { url: URL.createObjectURL(file), isUploading: true }]);
      
      setUploadingImage(true);
      
      // Tạo FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Gọi API tải lên
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Lấy URL hình ảnh đã tải lên
      const imageUrl = response.data.url;
      
      // Cập nhật danh sách hình ảnh
      setProductImages(prev => {
        const updated = [...prev];
        updated[tempImageIndex] = { url: imageUrl };
        return updated;
      });
      
      // Nếu là hình ảnh đầu tiên, đặt làm ảnh chính
      if (productImages.length === 0) {
        setProductData(prev => ({
          ...prev,
          imageUrl: imageUrl
        }));
      }
      
      toast.success('Đã tải lên hình ảnh thành công');
    } catch (error) {
      console.error('Lỗi khi tải lên hình ảnh:', error);
      
      // Xóa hình ảnh lỗi khỏi danh sách
      setProductImages(prev => prev.filter((_, index) => index !== productImages.length - 1));
      
      toast.error('Đã xảy ra lỗi khi tải lên hình ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  // Hàm xử lý khi nhập URL hình ảnh mới
  const handleAddImageUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error('Vui lòng nhập URL hình ảnh');
      return;
    }
    
    // Kiểm tra tính hợp lệ của URL hình ảnh
    if (!isValidImageUrl(imageUrl)) {
      toast.error('URL hình ảnh không hợp lệ. Hãy đảm bảo URL kết thúc bằng .jpg, .png, .gif,...');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Kiểm tra xem hình ảnh có tải được không
      const imageLoads = await checkImageLoads(imageUrl);
      if (!imageLoads) {
        toast.error('Không thể tải hình ảnh từ URL này. Vui lòng kiểm tra lại');
        setUploadingImage(false);
        return;
      }
      
      // Kiểm tra trước khi thêm hình ảnh
      const isFirstImage = productImages.length === 0;
      
      // Thêm một placeholder cho hình ảnh đang được tải lên
      const tempImageIndex = productImages.length;
      setProductImages(prev => [...prev, { url: imageUrl, isUploading: true }]);
      
      // Thêm hình ảnh vào API nếu sản phẩm đã tồn tại
      if (id) {
        try {
          await axios.post(`/api/products/${id}/images`, {
            imageUrl: imageUrl,
            order: tempImageIndex
          });
        } catch (error) {
          console.error('Lỗi khi lưu hình ảnh vào server:', error);
          // Không dừng quá trình nếu lỗi API, vẫn hiển thị hình ảnh bên client
        }
      }
      
      // Cập nhật danh sách hình ảnh và đảm bảo không còn trạng thái uploading
      setProductImages(prev => {
        const updated = [...prev];
        if (updated[tempImageIndex]) {
          updated[tempImageIndex] = { 
            url: imageUrl,
            isUploading: false
          };
        }
        return updated;
      });
      
      // Nếu là hình ảnh đầu tiên, đặt làm ảnh chính
      if (isFirstImage) {
        setProductData(prev => ({
          ...prev,
          imageUrl: imageUrl
        }));
        
        toast.success('Đã thêm hình ảnh và đặt làm ảnh chính');
      } else {
        toast.success('Đã thêm hình ảnh thành công');
      }
      
      // Xóa URL sau khi thêm
      setImageUrl('');
    } catch (error) {
      console.error('Lỗi khi thêm hình ảnh từ URL:', error);
      
      // Xóa hình ảnh lỗi khỏi danh sách
      setProductImages(prev => prev.filter((_, index) => index !== productImages.length - 1));
      
      toast.error('Đã xảy ra lỗi khi thêm hình ảnh từ URL');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = productImages[index];
    
    setProductImages(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    
    // Nếu xóa ảnh chính, cập nhật lại ảnh chính nếu còn hình ảnh khác
    if (imageToRemove.url === productData.imageUrl) {
      if (productImages.length > 1) {
        const newMainImageUrl = index === 0 && productImages.length > 1 
          ? productImages[1].url 
          : productImages[0].url;
        
        setProductData(prev => ({
          ...prev,
          imageUrl: newMainImageUrl
        }));
      } else {
        setProductData(prev => ({
          ...prev,
          imageUrl: ''
        }));
      }
    }
    
    // Xóa hình ảnh từ server nếu đã được lưu
    if (imageToRemove.id) {
      axios.delete(`/api/products/${id}/images?imageId=${imageToRemove.id}`)
        .catch(err => {
          console.error('Lỗi khi xóa hình ảnh từ server:', err);
          toast.error('Không thể xóa hình ảnh từ server');
        });
    }
  };

  const setAsMainImage = (url: string) => {
    setProductData(prev => ({
      ...prev,
      imageUrl: url
    }));
    toast.success('Đã đặt làm ảnh chính');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Chuyển đổi giá và tồn kho sang số
      const formattedData = {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock, 10)
      };
      
      // Cập nhật thông tin sản phẩm
      await axios.put(`/api/admin/products/${id}`, formattedData);
      
      // Quản lý các hình ảnh (thêm hình ảnh mới)
      const newImages = productImages.filter(img => !img.id);
      
      // Nếu có hình ảnh mới (không có id), thêm vào database
      if (newImages.length > 0) {
        // Xử lý từng hình ảnh một để tránh lỗi khi có một hình ảnh lỗi
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          
          // Bỏ qua nếu là ảnh chính (đã được lưu trong product)
          if (img.url === productData.imageUrl) continue;
          
          try {
            await axios.post(`/api/products/${id}/images`, {
              imageUrl: img.url,
              order: i + 1 // Ảnh chính là thứ tự 0
            });
          } catch (imgError) {
            console.error(`Lỗi khi lưu hình ảnh ${i + 1}:`, imgError);
            // Không dừng quá trình nếu một hình ảnh lỗi
          }
        }
      }
      
      toast.success('Đã cập nhật sản phẩm thành công');
      
      // Chuyển hướng về trang danh sách sản phẩm
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật sản phẩm:', err);
      
      // Hiển thị thông báo lỗi
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Đã xảy ra lỗi khi cập nhật sản phẩm');
      }
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold">Chỉnh Sửa Sản Phẩm</h1>
          <div className="flex space-x-4">
            <Link 
              href={`/admin/products/${id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Xem Chi Tiết
            </Link>
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => router.push('/admin/products')}
            >
              Quay Lại
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên sản phẩm */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Tên Sản Phẩm <span className="text-red-500">*</span>
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                name="name"
                type="text"
                placeholder="Nhập tên sản phẩm"
                value={productData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Giá sản phẩm */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                Giá (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="price"
                name="price"
                type="number"
                min="0"
                step="1000"
                placeholder="Nhập giá sản phẩm"
                value={productData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Tồn kho */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">
                Số Lượng <span className="text-red-500">*</span>
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="stock"
                name="stock"
                type="number"
                min="0"
                placeholder="Nhập số lượng tồn kho"
                value={productData.stock}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Danh mục */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryId">
                Danh Mục <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="categoryId"
                name="categoryId"
                value={productData.categoryId}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Thương hiệu */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brand">
                Thương Hiệu
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="brand"
                name="brand"
                value={productData.brand}
                onChange={handleInputChange}
              >
                <option value="">Chọn thương hiệu</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Nếu không có thương hiệu phù hợp, hệ thống sẽ tự động xác định từ tên sản phẩm
              </p>
            </div>

            {/* Sản phẩm nổi bật */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={productData.isFeatured}
                  onChange={(e) => setProductData(prev => ({
                    ...prev,
                    isFeatured: e.target.checked
                  }))}
                />
                <label htmlFor="isFeatured" className="ml-2 block text-gray-700 text-sm font-bold">
                  Đánh dấu là sản phẩm nổi bật
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sản phẩm được đánh dấu sẽ hiển thị trong phần "Sản phẩm nổi bật" trên trang chủ
              </p>
            </div>

            {/* Quản lý hình ảnh */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Hình Ảnh Sản Phẩm
              </label>
              
              {/* Thêm hình ảnh từ URL */}
              <div className="mb-4 border rounded p-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Thêm Hình Ảnh Từ URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Nhập URL hình ảnh"
                    className="flex-grow shadow appearance-none border rounded-l py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={uploadingImage || !imageUrl.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline disabled:opacity-50"
                  >
                    Thêm
                  </button>
                </div>
              </div>
              
              {/* Khu vực tải lên */}
              <div 
                className={`border-2 border-dashed rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                  uploadingImage ? 'opacity-50' : ''
                }`}
                onClick={() => {
                  if (!uploadingImage) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleImageUpload(e.target.files[0]);
                      }
                    };
                    input.click();
                  }
                }}
              >
                {uploadingImage ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Đang tải lên...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-sm text-gray-500">Click để chọn hình ảnh</p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, JPEG</p>
                  </div>
                )}
              </div>
              
              {/* Hiển thị danh sách hình ảnh */}
              {productImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Danh sách hình ảnh:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {productImages.map((image, index) => (
                      <div key={index} className={`relative rounded border ${image.url === productData.imageUrl ? 'ring-2 ring-blue-500' : ''}`}>
                        <img 
                          src={image.url} 
                          alt={`Product image ${index + 1}`} 
                          className="w-full h-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/300x300?text=Hình+ảnh+lỗi';
                            console.error(`Lỗi khi tải hình ảnh từ URL: ${image.url}`);
                            toast.error('Không thể tải hình ảnh, vui lòng kiểm tra lại URL', {
                              id: `img-error-${index}`, // Đảm bảo không hiển thị nhiều thông báo trùng lặp
                              duration: 3000
                            });
                          }}
                        />
                        <div className="absolute top-0 right-0 p-1 flex space-x-1">
                          {image.url !== productData.imageUrl && (
                            <button 
                              type="button"
                              className="bg-blue-500 text-white rounded-full p-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAsMainImage(image.url);
                              }}
                              title="Đặt làm ảnh chính"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </button>
                          )}
                          <button 
                            type="button"
                            className="bg-red-500 text-white rounded-full p-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            title="Xóa hình ảnh"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        {image.url === productData.imageUrl && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 text-center">
                            Ảnh chính
                          </div>
                        )}
                        {image.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mô tả sản phẩm */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Mô Tả
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                name="description"
                rows={4}
                placeholder="Nhập mô tả sản phẩm"
                value={productData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Nút lưu thay đổi */}
            <div className="md:col-span-2 flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Đang Xử Lý...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 