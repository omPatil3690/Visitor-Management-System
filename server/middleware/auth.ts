import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, AuthUser } from "../types";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-key-change-in-production";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET environment variable is not set in production. Using fallback secret.");
}

// Failed login attempts tracking
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

export const generateToken = (user: AuthUser): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(user, JWT_SECRET, { expiresIn } as any);
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Check login attempts for rate limiting
export const checkLoginAttempts = (
  email: string,
): { allowed: boolean; resetIn?: number } => {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    return { allowed: true };
  }

  // Reset if lockout period has passed
  if (now > attempts.resetAt) {
    loginAttempts.delete(email);
    return { allowed: true };
  }

  // Check if max attempts exceeded
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const resetIn = Math.ceil((attempts.resetAt - now) / 1000);
    return { allowed: false, resetIn };
  }

  return { allowed: true };
};

// Record failed login attempt
export const recordFailedLogin = (email: string): void => {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(email, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION,
    });
  } else {
    attempts.count++;
  }
};

// Clear login attempts on successful login
export const clearLoginAttempts = (email: string): void => {
  loginAttempts.delete(email);
};
