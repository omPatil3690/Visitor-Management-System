import { Request } from 'express';
import { UserRole } from '../../src/generated/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateVisitorRequest {
  name: string;
  email: string;
  phone: string;
  company?: string;
  photoUrl?: string;
}

export interface CreateVisitRequest {
  visitorId: string;
  hostId: string;
  purpose: string;
  validUntil: string;
  notes?: string;
}

export interface UpdateVisitRequest {
  status?: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}
