/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'VND', 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'VND'): string => {
  if (!amount && amount !== 0) return '';
  
  try {
    // Các loại tiền tệ cần xử lý đặc biệt
    if (currency === 'VND') {
      // VND không sử dụng phần thập phân
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    // Các loại tiền tệ khác
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback đơn giản
    return `${amount.toLocaleString()} ${currency}`;
  }
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param locale The locale to use for formatting
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, locale: string = 'vi-VN'): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Truncate a string to a maximum length
 * @param text The text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}; 