/**
 * @fileoverview This module provides authentication-related functions,
 * including password hashing, token generation and verification,
 * and session management.
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Valid role values based on the Prisma schema
const VALID_ROLES = ['USER', 'ADMIN', 'MANAGER', 'EMPLOYEE'];

/**
 * Hashes a password using bcrypt.
 * @param password - The password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a password with a hashed password using bcrypt.
 * @param password - The plain text password.
 * @param hashedPassword - The hashed password.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generates a JWT token.
 * The roleInfo parameter can be a string (role name) or an object containing role id and/or name.
 * If roleInfo is a string, it's used as the role name.
 * If roleInfo is an object, its id and name properties are used.
 * If roleInfo is null or undefined, a default role of 'USER' is assigned.
 * The role name must be one of the VALID_ROLES.
 * @param userId - The ID of the user.
 * @param roleInfo - Optional role information for the user. Can be a role name string,
 *                   an object with `id` and/or `name` properties, or null/undefined.
 * @returns A promise that resolves to the generated JWT token.
 */
export async function generateToken(userId: string, roleInfo?: { id?: string, name?: string } | string | null): Promise<string> {
  // Handle different role types properly
  let roleId: string | undefined = undefined;
  let roleName: string = 'USER'; // Default role
  
  if (roleInfo != null) {
    if (typeof roleInfo === 'string') {
      // If it's already a string, use it as the role name
      if (VALID_ROLES.includes(roleInfo)) {
        roleName = roleInfo;
      }
    } else if (typeof roleInfo === 'object') {
      // Handle role object with id and name
      if (roleInfo.id) {
        roleId = roleInfo.id;
      }
      
      if (roleInfo.name && VALID_ROLES.includes(roleInfo.name)) {
        roleName = roleInfo.name;
      }
    }
  }
  
  console.log('Generating token with roleId:', roleId, 'roleName:', roleName);
  
  const token = await new SignJWT({ userId, roleId, role: roleName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token.toString();
}

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns A promise that resolves to the token payload if verification is successful,
 *          or null if the token is invalid, expired, or verification fails for any other reason.
 */
export async function verifyToken(token: string) {
  try {

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Token validation error: Empty or invalid token');
      return null;
    }
    

    const { payload } = await jwtVerify(token, secret);

    // Validate payload contains required fields
    if (!payload.userId) {
      console.error('Token missing userId in payload');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Retrieves the current session from cookies.
 * Verifies the session token and returns the payload.
 * @returns A promise that resolves to the session payload if a valid session token exists,
 *          or null if no token is found or token verification fails.
 */
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    return payload
  } catch {
    return null
  }
}

/**
 * Creates a new session in the database.
 * This involves generating a session token and storing it along with the user ID and expiration date.
 * @param userId - The ID of the user for whom to create the session.
 * @returns A promise that resolves to the created session object from the database.
 */
export async function createSession(userId: string) {
  // Get the user to access the role
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { 
      roleId: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  // Create a role object with both id and name
  const roleInfo = {
    id: user?.roleId || undefined,
    name: user?.role?.name || 'USER'
  };
  
  const sessionToken = await generateToken(userId, roleInfo);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days from now

  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });
} 