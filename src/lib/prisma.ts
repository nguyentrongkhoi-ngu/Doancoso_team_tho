// Proxy file để duy trì khả năng tương thích với các import cũ
// Sử dụng singleton pattern từ @/db thay vì tạo instance mới
import { prisma as dbPrisma } from '@/db';

// Re-export các export từ @/db
export const prisma = dbPrisma;
export default dbPrisma;

// TODO: Migrate all imports from @/lib/prisma to @/db
// This file maintains backward compatibility