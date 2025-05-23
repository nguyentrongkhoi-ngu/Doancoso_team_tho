'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Khởi tạo theme từ localStorage hoặc mặc định
  useEffect(() => {
    // Kiểm tra theme đã lưu trong localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;

    // Nếu có theme đã lưu, sử dụng nó
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.body.classList.add('theme-transition-ready');
    } else {
      // Nếu không có, kiểm tra theme ưa thích của hệ thống
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
      localStorage.setItem('theme', defaultTheme);

      // Thêm class sau một khoảng thời gian nhỏ để tránh hiệu ứng flash khi tải trang
      setTimeout(() => {
        document.body.classList.add('theme-transition-ready');
      }, 100);
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('theme-transition-ready');
    };
  }, []);

  // Hàm chuyển đổi theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  // Hàm đặt theme cụ thể
  const setThemeValue = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  // Hàm áp dụng theme
  const applyTheme = (newTheme: Theme) => {
    // Thêm class để hiệu ứng chuyển đổi mượt mà
    document.body.classList.add('theme-changing');

    // Cập nhật state và localStorage
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Áp dụng theme mới
    document.documentElement.setAttribute('data-theme', newTheme);

    // Xóa class sau khi hoàn tất chuyển đổi
    setTimeout(() => {
      document.body.classList.remove('theme-changing');
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeValue }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook để sử dụng theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
