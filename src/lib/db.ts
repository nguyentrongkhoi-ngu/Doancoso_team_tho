import { prisma } from '@/db';

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function createUser({ name, email, password }: { name: string; email: string; password: string }) {
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password
      }
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: @/lib/db is deprecated and will be removed in a future release. ' +
    'Please update your imports to use @/db instead.'
  );
} 