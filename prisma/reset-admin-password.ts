import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Client, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@'));

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create Neon client and Prisma adapter
const client = new Client(databaseUrl);
const adapter = new PrismaNeon(client);

// Initialize Prisma Client with Neon adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Resetting admin password...\n');

  const adminEmail = 'admin@vms.com';
  const newPassword = 'admin123';

  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update the admin user
  const updated = await prisma.host.update({
    where: { email: adminEmail },
    data: { passwordHash },
  });

  console.log('✓ Admin password has been reset!');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  New Password: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error('Error resetting password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
