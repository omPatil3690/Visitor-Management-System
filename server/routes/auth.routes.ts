import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import {
  generateToken,
  requireAuth,
  checkLoginAttempts,
  recordFailedLogin,
  clearLoginAttempts,
} from "../middleware/auth";
import { validate, loginSchema } from "../middleware/validation";
import { AuthRequest, LoginRequest } from "../types";

const router = Router();

// Login
router.post(
  "/login",
  validate(loginSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check login attempts
      const attemptCheck = checkLoginAttempts(email);
      if (!attemptCheck.allowed) {
        return res.status(429).json({
          error: `Too many failed login attempts. Please try again in ${attemptCheck.resetIn} seconds.`,
        });
      }

      // Find host by email
      const host = await prisma.host.findUnique({
        where: { email },
        include: { department: true },
      });

      if (!host) {
        recordFailedLogin(email);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if host is active
      if (!host.active) {
        return res.status(401).json({ error: "Account is disabled" });
      }

      // Verify password
      if (!host.passwordHash) {
        return res
          .status(401)
          .json({ error: "Password not set. Please contact administrator." });
      }

      const isValidPassword = await bcrypt.compare(password, host.passwordHash);

      if (!isValidPassword) {
        recordFailedLogin(email);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Clear failed attempts on successful login
      clearLoginAttempts(email);

      // Generate JWT token
      const user = {
        id: host.id,
        email: host.email,
        name: host.name,
        role: host.role,
        departmentId: host.departmentId,
      };

      const token = generateToken(user);

      // Set cookie with secure settings
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        user,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get current session
router.get("/session", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch fresh user data
    const host = await prisma.host.findUnique({
      where: { id: req.user.id },
      include: { department: true },
    });

    if (!host || !host.active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    return res.json({
      user: {
        id: host.id,
        email: host.email,
        name: host.name,
        role: host.role,
        departmentId: host.departmentId,
        department: host.department,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", (req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
});

export default router;
