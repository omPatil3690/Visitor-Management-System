import { PrismaClient } from "../../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

// Configure Neon for Node.js environment (required for non-edge environments)
neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found!");
  console.error(
    "Available env keys:",
    Object.keys(process.env).filter((k) => k.includes("DATABASE")),
  );
  throw new Error("DATABASE_URL environment variable is not set");
}

console.log("✅ DATABASE_URL loaded:", databaseUrl.substring(0, 50) + "...");

// PrismaClient singleton for server
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with Neon adapter
function createPrismaClient() {
  console.log("🔧 Creating PrismaNeon adapter...");
  // PrismaNeon in @prisma/adapter-neon 7.x takes a config object with connectionString
  const adapter = new PrismaNeon({ connectionString: databaseUrl });

  console.log("🔧 Creating PrismaClient...");
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Use existing client or create new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache for subsequent imports in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

console.log("✅ Prisma client initialized successfully");

export default prisma;

