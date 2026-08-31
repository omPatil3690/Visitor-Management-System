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

console.log('Using database URL:', databaseUrl.substring(0, 30) + '...');

// Configure Neon for Node.js environment
neonConfig.webSocketConstructor = ws;

// Create Neon client
const client = new Client(databaseUrl);

// Create Neon adapter
const adapter = new PrismaNeon(client);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn']
});

async function main() {
  console.log('Starting database seed...');

  // Seed departments
  const departments = [
    { name: 'Administration' },
    { name: 'Faculty' },
    { name: 'Security' },
    { name: 'IT Department' },
    { name: 'Facilities' },
  ];

  console.log('Creating departments...');
  const departmentRecords = [];

  for (const dept of departments) {
    const existing = await prisma.department.findFirst({
      where: { name: dept.name },
    });

    if (!existing) {
      const created = await prisma.department.create({
        data: dept,
      });
      departmentRecords.push(created);
      console.log(`✓ Department created: ${dept.name}`);
    } else {
      departmentRecords.push(existing);
      console.log(`✓ Department already exists: ${dept.name}`);
    }
  }

  // Seed admin user
  console.log('\nCreating admin user...');
  const adminEmail = 'admin@vms.com';
  const existingAdmin = await prisma.host.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminDepartment = departmentRecords.find(d => d.name === 'Administration');
    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.host.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        active: true,
        departmentId: adminDepartment?.id || null,
      },
    });
    console.log(`✓ Admin user created:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: admin123`);
  } else {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
