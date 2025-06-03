import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Kết hợp các classNames và xử lý các trường hợp xung đột với Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", { locale: vi })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error formatting date:", error);
    }
    return dateString
  }
}

export function formatPrice(price: number): string {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error formatting price:", error);
    }
    return `${price.toLocaleString('vi-VN')} VND`;
  }
}