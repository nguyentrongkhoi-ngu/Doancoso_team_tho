'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';
import axios from 'axios';
import React from 'react';

// Định nghĩa type cho Product và InventoryHistory để tránh lỗi TypeScript
interface Product {
  id: string;
  name: string;
  stock: number;
}
interface InventoryHistory {
  id: string;
  change: number;
  reason?: string;
  createdAt: string;
  user?: { name?: string; email?: string };
}

export default function InventoryAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [change, setChange] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await axios.get('/api/products/search?limit=100');
    setProducts(res.data.products || []);
  }

  async function fetchHistory(productId: string) {
    const res = await axios.get(`/api/inventory/history?productId=${productId}`);
    setHistory(res.data);
  }

  // Khi chọn sản phẩm khác, reset lịch sử và trường nhập
  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setChange(0);
    setReason('');
    setHistory([]);
    fetchHistory(p.id);
  }

  async function handleAdjustStock() {
    if (!selectedProduct) return;
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/inventory/adjust', {
        productId: selectedProduct.id,
        change: Number(change),
        reason,
      });
      setMessage('Cập nhật kho thành công!');
      fetchProducts();
      fetchHistory(selectedProduct.id);
      setChange(0);
      setReason('');
      setShowConfirm(false);
    } catch (e) {
      setMessage('Có lỗi xảy ra!');
    }
    setLoading(false);
  }

  // Cảnh báo tồn kho thấp
  const lowStockThreshold = 5;
  const lowStockProducts = products.filter((p) => p.stock <= lowStockThreshold);

  // Thêm tìm kiếm sản phẩm theo tên
  const [search, setSearch] = useState('');
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">Quản lý kho</h1>
      <input
        type="text"
        className="input input-bordered mb-4 w-full max-w-md"
        placeholder="Tìm kiếm sản phẩm theo tên..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
      />
      {lowStockProducts.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <b>Cảnh báo:</b> Các sản phẩm sau sắp hết hàng:
          <ul className="list-disc ml-6">
            {lowStockProducts.map((p) => (
              <li key={p.id}>{p.name} (Tồn kho: {p.stock})</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-8">
        <div className="w-1/2">
          <h2 className="font-semibold mb-2">Danh sách sản phẩm</h2>
          <ul className="border rounded divide-y">
            {filteredProducts.map((p) => (
              <li key={p.id} className={`p-2 cursor-pointer ${selectedProduct?.id === p.id ? 'bg-blue-100' : ''}`} onClick={() => handleSelectProduct(p)}>
                <span className="font-medium">{p.name}</span> <span className="ml-2 text-sm">(Tồn kho: {p.stock})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2">
          {selectedProduct && (
            <div>
              <h2 className="font-semibold mb-2">Điều chỉnh kho cho: {selectedProduct.name}</h2>
              <div className="mb-2">
                <input type="number" className="input input-bordered mr-2" value={change} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChange(Number(e.target.value))} placeholder="Số lượng (+ nhập, - xuất)" />
                <input type="text" className="input input-bordered mr-2" value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} placeholder="Lý do" />
                <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={loading}>Cập nhật</button>
              </div>
              {/* Modal xác nhận */}
              {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                    <h3 className="font-bold mb-2">Xác nhận điều chỉnh kho</h3>
                    <p>Bạn có chắc chắn muốn {change > 0 ? `nhập thêm +${change}` : `xuất kho ${change}`} sản phẩm <b>{selectedProduct.name}</b>?</p>
                    {reason && <p className="text-sm mt-1">Lý do: {reason}</p>}
                    <div className="flex justify-end gap-2 mt-4">
                      <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={loading}>Huỷ</button>
                      <button className="btn btn-primary" onClick={handleAdjustStock} disabled={loading}>Xác nhận</button>
                    </div>
                  </div>
                </div>
              )}
              {message && <div className="mb-2 text-green-600">{message}</div>}
              <h3 className="font-semibold mt-4 mb-2">Lịch sử thay đổi kho</h3>
              <ul className="border rounded divide-y max-h-64 overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id} className="p-2 text-sm">
                    <span>{h.createdAt?.slice(0, 19).replace('T', ' ')}</span> | <span>{h.change > 0 ? '+' : ''}{h.change}</span> | <span>{h.reason}</span> | <span>{h.user?.name || h.user?.email || 'Admin'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
