import { PrismaClient } from '@prisma/client';

// Đảm bảo chỉ có một instance của PrismaClient trong development
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Tránh tạo nhiều instances của PrismaClient trong development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

export { prisma };
export default prisma;

// Một helper function để xử lý lỗi cơ sở dữ liệu một cách nhất quán
export async function handleDbError<T>(
  operation: () => Promise<T>, 
  fallback: T | null = null, 
  errorMessage = 'Database operation failed'
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // Kiểm tra nếu có cấu hình sử dụng fallback khi lỗi
    if (process.env.ENABLE_FALLBACK_ON_ERROR === 'true') {
      console.log('Using fallback data due to database error');
      return fallback;
    }
    
    throw error;
  }
} 