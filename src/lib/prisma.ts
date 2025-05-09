// Proxy file để duy trì khả năng tương thích với các import cũ
// Sử dụng singleton pattern từ @/db thay vì tạo instance mới
import { prisma as dbPrisma } from '@/db';

// Re-export các export từ @/db
export const prisma = dbPrisma;
export default dbPrisma;

// Log cảnh báo trong môi trường phát triển
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: @/lib/prisma is deprecated and will be removed in a future release. ' +
    'Please update your imports to use @/db instead.'
  );
} 