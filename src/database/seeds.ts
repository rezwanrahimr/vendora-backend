import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

console.log('Seed script loaded.');

/* -----------------------------
   Config
------------------------------ */
const config = {
  dbUrl: process.env.DATABASE_URL,
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@gmail.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
};

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'VENDOR' | 'USER';
};

const seedUsers = async (prisma: PrismaClient) => {
  const users: SeedUser[] = [
    {
      name: 'Admin User',
      email: 'admin@e.com',
      password: 'strongPassword123',
      role: 'ADMIN',
    },
    {
      name: 'Vendor User',
      email: 'vendor@e.com',
      password: 'strongPassword123',
      role: 'VENDOR',
    },
    {
      name: 'Regular User',
      email: 'user@e.com',
      password: 'strongPassword123',
      role: 'USER',
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`${user.role} already exists: ${user.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });

    console.log(`${user.role} created: ${user.email}`);
  }
};

/* -----------------------------
   Prisma Setup
------------------------------ */
const createPrisma = () => {
  if (!config.dbUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const pool = new Pool({ connectionString: config.dbUrl });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['error', 'warn'],
  });

  return { prisma, pool };
};

/* -----------------------------
   Category Seed
------------------------------ */
const seedDefaultCategory = async (prisma: PrismaClient) => {
  const existing = await prisma.category.findFirst({
    where: { name: 'General' },
  });

  if (existing) {
    console.log('Default category already exists.');
    return existing;
  }

  const category = await prisma.category.create({
    data: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'General',
      icon: '🏪',
    },
  });

  console.log('Default category created.');
  return category;
};

/* -----------------------------
   Admin Seed
------------------------------ */
const seedAdminUser = async (prisma: PrismaClient) => {
  const existing = await prisma.user.findUnique({
    where: { email: config.adminEmail },
  });

  if (existing) {
    console.log('Admin user already exists.');
    return existing;
  }

  const hashedPassword = await bcrypt.hash(config.adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: config.adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  console.log('Admin user created successfully.');
  return admin;
};

/* -----------------------------
   Main Seeder
------------------------------ */
async function runSeeds() {
  console.log('Starting seed script...');

  const { prisma, pool } = createPrisma();

  try {
    await prisma.$connect();
    console.log('Connected to database.');

    await seedDefaultCategory(prisma);
    await seedUsers(prisma);

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    try {
      await prisma.$disconnect();
    } finally {
      await pool.end();
    }
  }
}

/* -----------------------------
   Execute
------------------------------ */
runSeeds().catch((err) => {
  console.error('Fatal seed error:', err);
});
