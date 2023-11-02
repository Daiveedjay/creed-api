import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Export the prisma client
export default db;