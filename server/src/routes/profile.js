import express from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).optional(),
      bio: z.string().max(500).optional(),
      profilePicture: z.string().refine((value) => value.startsWith('data:image/') || /^https?:\/\//.test(value), 'Profile picture must be an image upload or URL').optional(),
      preferredCountries: z.array(z.string()).optional(),
      preferredCategories: z.array(z.string()).optional(),
      notificationsEnabled: z.boolean().optional(),
      browserNotificationsEnabled: z.boolean().optional(),
      emailAlertsEnabled: z.boolean().optional(),
      pdfAlertsEnabled: z.boolean().optional()
    }).parse(req.body);

    const user = await User.findByIdAndUpdate(req.user.id, body, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all users
router.get('/admin/users', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Admin: Update user role
router.put('/admin/users/:userId/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const body = z.object({ role: z.enum(['admin', 'analyst', 'viewer']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.userId, body, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete user
router.delete('/admin/users/:userId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
