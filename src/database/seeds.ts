import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

console.log('Seed script loaded.');

async function runSeeds() {
  console.log('Starting seed script...');

  const connectionString = process.env.DATABASE_URL || '';

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const pool = new Pool({ connectionString });

  // Add error handler to prevent unhandled errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

  console.log('Prisma client created.');
  await prisma.$connect();
  console.log('Connected to database.');

  try {
    // Create default category if not exists
    let defaultCategory = await prisma.category.findFirst({
      where: { name: 'General' },
    });

    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'General',
          icon: '🏪',
        },
      });
      console.log('Default category created.');
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seeding.');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          isEmailVerified: true,
        },
      });

      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runSeeds().catch((error) => console.error(error));
