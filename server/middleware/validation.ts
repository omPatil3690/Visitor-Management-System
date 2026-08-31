import { z } from "zod";

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Create visit validation schema
export const createVisitSchema = z.object({
  visitorId: z.string().uuid("Invalid visitor ID"),
  hostId: z.string().uuid("Invalid host ID"),
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(500, "Purpose is too long"),
  validUntil: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Valid until date must be in the future",
    ),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

// Update visit validation schema
export const updateVisitSchema = z
  .object({
    status: z
      .enum(["pending", "approved", "denied", "completed", "cancelled"])
      .optional(),
    checkInTime: z.string().datetime().optional(),
    checkOutTime: z.string().datetime().optional(),
    notes: z.string().max(1000, "Notes are too long").optional(),
  })
  .refine(
    (data) => {
      // If both checkIn and checkOut are provided, checkOut must be after checkIn
      if (data.checkInTime && data.checkOutTime) {
        return new Date(data.checkOutTime) > new Date(data.checkInTime);
      }
      return true;
    },
    {
      message: "Check-out time must be after check-in time",
      path: ["checkOutTime"],
    },
  );

// Create visitor validation schema
export const createVisitorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  company: z.string().max(100, "Company name is too long").optional(),
  photoUrl: z.string().url("Invalid URL").optional(),
});

// Create host validation schema
export const createHostSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.string().uuid("Invalid department ID").optional(),
  role: z.enum(["admin", "guard", "host"]),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
