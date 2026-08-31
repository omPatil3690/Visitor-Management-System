import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Search host by email
router.get('/search', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const host = await prisma.host.findUnique({
      where: { email: email as string },
      include: {
        department: true,
      },
    });

    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Don't return password hash
    const { passwordHash, ...hostData } = host;

    return res.json(hostData);
  } catch (error) {
    console.error('Search host error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all hosts
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Only admin and guard can list all hosts
    if (user.role !== 'admin' && user.role !== 'guard') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = '50', offset = '0', active } = req.query;

    const where: any = {};

    if (active !== undefined) {
      where.active = active === 'true';
    }

    const hosts = await prisma.host.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.host.count({ where });

    // Remove password hashes
    const hostsData = hosts.map(({ passwordHash, ...host }) => host);

    return res.json({
      hosts: hostsData,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get hosts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get host by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const host = await prisma.host.findUnique({
      where: { id: id as string },
      include: {
        department: true,
      },
    });

    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Don't return password hash
    const { passwordHash, ...hostData } = host;

    return res.json(hostData);
  } catch (error) {
    console.error('Get host error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
