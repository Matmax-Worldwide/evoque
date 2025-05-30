/**
 * @fileoverview This module initializes and exports the Prisma client.
 * It handles Prisma client instantiation differently in development versus production
 * to prevent issues with hot reloading creating too many connections.
 * In development, it uses a global instance. In production, it creates a new instance.
 * It also includes a basic connection test.
 */
import { PrismaClient } from '@prisma/client';

// Create the global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Do not instantiate a new PrismaClient in development when hot-reloading happens
// See https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // Production: Always create a new PrismaClient instance
  prismaClient = new PrismaClient({
    log: ['error'],
  });
} else {
  // Development: Use global to preserve connection between hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  } 
  prismaClient = global.prisma;
}

// Test the connection
// This block attempts to connect to the database as soon as the Prisma client is initialized.
// It logs a success message or an error message to the console based on the connection attempt.
prismaClient.$connect()
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err);
  });

/**
 * The Prisma client instance.
 * This instance is configured to handle database connections optimally
 * for both development (preserving connections across hot reloads) and production environments.
 */
export const prisma = prismaClient; 