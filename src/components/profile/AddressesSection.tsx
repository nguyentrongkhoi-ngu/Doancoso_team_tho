'use client';

import { useState, useEffect } from 'react';

interface Address {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

interface AddressesSectionProps {
  onError: (message: string) => void;
}

export default function AddressesSection({ onError }: AddressesSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Việt Nam', // Default
    phoneNumber: '',
    isDefault: false
  });
  
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/addresses');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách địa chỉ');
      }
      
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách địa chỉ:', error);
      onError('Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAddresses();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const resetForm = () => {
    setFormData({
      id: '',
      fullName: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Việt Nam',
      phoneNumber: '',
      isDefault: false
    });
  };
  
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể thêm địa chỉ');
      }
      
      // Refresh list and close form
      await fetchAddresses();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi thêm địa chỉ:', error);
      onError('Không thể thêm địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/addresses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể cập nhật địa chỉ');
      }
      
      // Refresh list and close form
      await fetchAddresses();
      setShowEditForm(false);
      setCurrentAddress(null);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi cập nhật địa chỉ:', error);
      onError('Không thể cập nhật địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/addresses?id=${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể xóa địa chỉ');
      }
      
      // Refresh list
      await fetchAddresses();
    } catch (error) {
      console.error('Lỗi khi xóa địa chỉ:', error);
      onError('Không thể xóa địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startEditAddress = (address: Address) => {
    setCurrentAddress(address);
    setFormData({
      id: address.id,
      fullName: address.fullName,
      address: address.address,
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country,
      phoneNumber: address.phoneNumber,
      isDefault: address.isDefault
    });
    setShowEditForm(true);
  };
  
  // Show loading indicator while fetching initial data
  if (isLoading && addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4">Đang tải địa chỉ giao hàng...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Địa chỉ giao hàng</h2>
        {!showAddForm && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            Thêm địa chỉ mới
          </button>
        )}
      </div>
      
      {/* Form thêm địa chỉ mới */}
      {showAddForm && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h3 className="text-lg font-medium mb-4">Thêm địa chỉ mới</h3>
            
            <form onSubmit={handleAddAddress}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Họ tên người nhận</span>
                  </label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Số điện thoại</span>
                  </label>
                  <input 
                    type="tel" 
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Địa chỉ</span>
                  </label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered" 
                    rows={2}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tỉnh/Thành phố</span>
                  </label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quận/Huyện</span>
                  </label>
                  <input 
                    type="text" 
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Mã bưu điện</span>
                  </label>
                  <input 
                    type="text" 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quốc gia</span>
                  </label>
                  <input 
                    type="text" 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input 
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="checkbox checkbox-primary" 
                    />
                    <span className="label-text">Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Form chỉnh sửa địa chỉ */}
      {showEditForm && currentAddress && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h3 className="text-lg font-medium mb-4">Chỉnh sửa địa chỉ</h3>
            
            <form onSubmit={handleEditAddress}>
              <input type="hidden" name="id" value={formData.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Họ tên người nhận</span>
                  </label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Số điện thoại</span>
                  </label>
                  <input 
                    type="tel" 
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Địa chỉ</span>
                  </label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered" 
                    rows={2}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tỉnh/Thành phố</span>
                  </label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quận/Huyện</span>
                  </label>
                  <input 
                    type="text" 
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Mã bưu điện</span>
                  </label>
                  <input 
                    type="text" 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quốc gia</span>
                  </label>
                  <input 
                    type="text" 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="input input-bordered" 
                    required
                  />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input 
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="checkbox checkbox-primary" 
                    />
                    <span className="label-text">Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEditForm(false);
                    setCurrentAddress(null);
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Danh sách địa chỉ */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-base-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-4 text-lg">Bạn chưa có địa chỉ giao hàng nào</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => setShowAddForm(true)}
          >
            Thêm địa chỉ mới
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className={`card bg-base-100 shadow-sm ${address.isDefault ? 'border-2 border-primary' : 'border border-base-300'}`}
            >
              <div className="card-body p-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{address.fullName}</h3>
                      {address.isDefault && (
                        <span className="badge badge-primary">Mặc định</span>
                      )}
                    </div>
                    <p>{address.phoneNumber}</p>
                    <p className="text-sm">
                      {address.address}, {address.city}
                      {address.state && `, ${address.state}`}
                      {address.postalCode && `, ${address.postalCode}`}
                    </p>
                    <p className="text-sm">{address.country}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => startEditAddress(address)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={isLoading}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 