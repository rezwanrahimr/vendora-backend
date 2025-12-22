import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

async function runSeeds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('seeds');
  try {
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
    await app.close();
  }
}

runSeeds().catch((error) => console.error(error));
