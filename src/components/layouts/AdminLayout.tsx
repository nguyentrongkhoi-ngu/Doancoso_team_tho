'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Home,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: 'Trang chủ',
      href: '/admin',
      icon: <Home className="h-5 w-5" />,
      active: pathname === '/admin'
    },
    {
      title: 'Sản phẩm',
      href: '/admin/products',
      icon: <Package className="h-5 w-5" />,
      active: pathname.includes('/admin/products')
    },
    {
      title: 'Đơn hàng',
      href: '/admin/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      active: pathname.includes('/admin/orders')
    },
    {
      title: 'Người dùng',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      active: pathname.includes('/admin/users')
    },
    {
      title: 'Hiệu suất AI',
      href: '/admin/recommendation-performance',
      icon: <Sparkles className="h-5 w-5" />,
      active: pathname.includes('/admin/recommendation-performance')
    },
    {
      title: 'Thống kê',
      href: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />,
      active: pathname.includes('/admin/analytics')
    },
    {
      title: 'Cài đặt',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      active: pathname.includes('/admin/settings')
    }
  ];

  // Tính toán breadcrumb dựa trên đường dẫn hiện tại
  const breadcrumbItems = React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ title: 'Admin', href: '/admin' }];
    
    // Thêm các phần phụ của đường dẫn
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const href = `/${parts.slice(0, i + 1).join('/')}`;
        const title = parts[i].charAt(0).toUpperCase() + parts[i].slice(1).replace(/-/g, ' ');
        breadcrumbs.push({ title, href });
      }
    }
    
    return breadcrumbs;
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center bg-white px-4 border-b shadow-sm">
        <div className="flex w-full justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">E-Commerce AI</span>
              <span className="ml-2 text-sm font-medium text-gray-500">Admin</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm hover:text-primary">
              Xem cửa hàng
            </Link>
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50/50">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <div className="px-4 py-2 border-b">
            <div className="flex items-center text-sm text-gray-500">
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.href}>
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="font-medium text-gray-900">{item.title}</span>
                  ) : (
                    <Link href={item.href} className="hover:text-primary">
                      {item.title}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
} 