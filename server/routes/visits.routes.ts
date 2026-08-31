import { Router, Response } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  validate,
  createVisitSchema,
  updateVisitSchema,
} from "../middleware/validation";
import { AuthRequest, CreateVisitRequest, UpdateVisitRequest } from "../types";

const router = Router();

// Get all visits with filters
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      hostId,
      startDate,
      endDate,
      limit = "50",
      offset = "0",
    } = req.query;
    const user = req.user!;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    // Role-based filtering
    if (user.role === "host" && !hostId) {
      // Regular hosts only see their own visits
      where.hostId = user.id;
    } else if (hostId) {
      where.hostId = hostId as string;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitor: true,
        host: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.visit.count({ where });

    return res.json({
      visits,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error("Get visits error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get visit statistics
router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query;

    const where: any = {};

    // Role-based filtering
    if (user.role === "host") {
      where.hostId = user.id;
    }

    // Date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Get counts by status
    const [pending, approved, completed, cancelled, denied] = await Promise.all(
      [
        prisma.visit.count({ where: { ...where, status: "pending" } }),
        prisma.visit.count({ where: { ...where, status: "approved" } }),
        prisma.visit.count({ where: { ...where, status: "completed" } }),
        prisma.visit.count({ where: { ...where, status: "cancelled" } }),
        prisma.visit.count({ where: { ...where, status: "denied" } }),
      ],
    );

    // Get total hosts count (only for admin/guard)
    let totalHosts = 0;
    if (user.role === "admin" || user.role === "guard") {
      totalHosts = await prisma.host.count({ where: { active: true } });
    }

    return res.json({
      pending,
      approved,
      completed,
      cancelled,
      denied,
      total: pending + approved + completed + cancelled + denied,
      totalHosts,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get single visit by ID
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const visit = await prisma.visit.findUnique({
      where: { id: id as string },
      include: {
        visitor: true,
        host: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    // Check permissions
    if (user.role === "host" && visit.hostId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(visit);
  } catch (error) {
    console.error("Get visit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create new visit
router.post(
  "/",
  requireAuth,
  validate(createVisitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        visitorId,
        hostId,
        purpose,
        validUntil,
        notes,
      }: CreateVisitRequest = req.body;

      if (!visitorId || !hostId || !purpose || !validUntil) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate that host exists and is active
      const host = await prisma.host.findUnique({
        where: { id: hostId },
      });

      if (!host) {
        return res.status(400).json({ error: "Host not found" });
      }

      if (!host.active) {
        return res.status(400).json({ error: "Host account is inactive" });
      }

      // Validate that visitor exists
      const visitor = await prisma.visitor.findUnique({
        where: { id: visitorId },
      });

      if (!visitor) {
        return res.status(400).json({ error: "Visitor not found" });
      }

      // Validate validUntil is in the future
      const validUntilDate = new Date(validUntil);
      if (validUntilDate <= new Date()) {
        return res
          .status(400)
          .json({ error: "Valid until date must be in the future" });
      }

      const visit = await prisma.visit.create({
        data: {
          visitorId,
          hostId,
          purpose,
          validUntil: validUntilDate,
          notes,
          status: "pending",
        },
        include: {
          visitor: true,
          host: true,
        },
      });

      return res.status(201).json(visit);
    } catch (error) {
      console.error("Create visit error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update visit
router.put(
  "/:id",
  requireAuth,
  validate(updateVisitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const user = req.user!;
      const updates: UpdateVisitRequest = req.body;

      // Check if visit exists
      const existingVisit = await prisma.visit.findUnique({
        where: { id },
      });

      if (!existingVisit) {
        return res.status(404).json({ error: "Visit not found" });
      }

      // Check permissions
      const canUpdate =
        user.role === "admin" ||
        user.role === "guard" ||
        (user.role === "host" && existingVisit.hostId === user.id);

      if (!canUpdate) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Prepare update data
      const updateData: any = {};

      if (updates.status) {
        // Track approval/denial with timestamp and user
        if (
          updates.status === "approved" &&
          existingVisit.status !== "approved"
        ) {
          updateData.approvedBy = user.id;
          updateData.approvedAt = new Date();

          // Only admin and guard can approve
          if (user.role !== "admin" && user.role !== "guard") {
            return res
              .status(403)
              .json({
                error: "Only administrators and guards can approve visits",
              });
          }
        } else if (
          updates.status === "denied" &&
          existingVisit.status !== "denied"
        ) {
          updateData.deniedBy = user.id;
          updateData.deniedAt = new Date();

          // Only admin and guard can deny
          if (user.role !== "admin" && user.role !== "guard") {
            return res
              .status(403)
              .json({
                error: "Only administrators and guards can deny visits",
              });
          }
        }

        updateData.status = updates.status;
      }

      if (updates.checkInTime) {
        updateData.checkInTime = new Date(updates.checkInTime);
      }

      if (updates.checkOutTime) {
        updateData.checkOutTime = new Date(updates.checkOutTime);
      }

      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const visit = await prisma.visit.update({
        where: { id },
        data: updateData,
        include: {
          visitor: true,
          host: true,
          approvedByHost: true,
          deniedByHost: true,
        },
      });

      return res.json(visit);
    } catch (error) {
      console.error("Update visit error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete visit
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Only admin can delete
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only administrators can delete visits" });
    }

    await prisma.visit.delete({
      where: { id: id as string },
    });

    return res.json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Delete visit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
