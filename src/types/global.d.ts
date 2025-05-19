import { PrismaClient } from '@prisma/client';

declare global {
  // Cho phép TypeScript hiểu global.prisma
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
} 