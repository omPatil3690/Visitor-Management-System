import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Client, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

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
  console.log('Checking admin user...\n');

  const adminEmail = 'admin@vms.com';

  // Find the admin user
  const admin = await prisma.host.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.log('❌ Admin user not found!');
    return;
  }

  console.log('✓ Admin user found:');
  console.log('  ID:', admin.id);
  console.log('  Email:', admin.email);
  console.log('  Name:', admin.name);
  console.log('  Role:', admin.role);
  console.log('  Active:', admin.active);
  console.log('  passwordHash exists:', !!admin.passwordHash);
  console.log('  passwordHash length:', admin.passwordHash?.length);
  console.log('  passwordHash preview:', admin.passwordHash?.substring(0, 20) + '...');

  // Test the password
  if (admin.passwordHash) {
    const testPassword = 'admin123';
    console.log('\nTesting password "admin123"...');
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log('  Password valid:', isValid);

    if (!isValid) {
      console.log('\n⚠️ Password does not match! Let me create a new hash for comparison:');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('  New hash:', newHash.substring(0, 20) + '...');
      console.log('  DB hash:', admin.passwordHash.substring(0, 20) + '...');
    }
  } else {
    console.log('\n❌ No password hash set!');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
