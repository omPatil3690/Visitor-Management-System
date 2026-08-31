import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest, CreateVisitorRequest } from '../types';

const router = Router();

// Search visitor by email
router.get('/search', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const where: any = {};

    if (email) {
      where.email = email as string;
    }

    if (phone) {
      where.phone = phone as string;
    }

    const visitor = await prisma.visitor.findFirst({
      where,
    });

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    return res.json(visitor);
  } catch (error) {
    console.error('Search visitor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all visitors
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    const visitors = await prisma.visitor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.visitor.count();

    return res.json({
      visitors,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get visitor by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const visitor = await prisma.visitor.findUnique({
      where: { id: id as string },
      include: {
        visits: {
          include: {
            host: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    return res.json(visitor);
  } catch (error) {
    console.error('Get visitor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update visitor
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, company, photoUrl }: CreateVisitorRequest = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    // Check if visitor exists
    const existing = await prisma.visitor.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          {
            AND: [
              { email },
              { phone },
            ],
          },
        ],
      },
    });

    let visitor;

    if (existing) {
      // Update existing visitor
      visitor = await prisma.visitor.update({
        where: { id: existing.id },
        data: {
          name,
          email,
          phone,
          company,
          photoUrl,
        },
      });
    } else {
      // Create new visitor
      visitor = await prisma.visitor.create({
        data: {
          name,
          email,
          phone,
          company,
          photoUrl,
        },
      });
    }

    return res.status(existing ? 200 : 201).json(visitor);
  } catch (error) {
    console.error('Create/update visitor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update visitor
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, photoUrl } = req.body;

    const visitor = await prisma.visitor.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(company !== undefined && { company }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });

    return res.json(visitor);
  } catch (error) {
    console.error('Update visitor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
