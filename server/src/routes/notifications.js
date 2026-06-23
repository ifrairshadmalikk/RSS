import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

function toUserNotification(item, userId) {
  const readBy = item.readBy || [];
  return {
    ...item,
    read: Boolean(item.read) || readBy.some((id) => String(id) === String(userId))
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(100).lean();
    const userItems = items.map((item) => toUserNotification(item, req.user.id));
    res.json({ items: userItems });
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const items = await Notification.find().select('read readBy').lean();
    const count = items.filter((item) => !toUserNotification(item, req.user.id).read).length;
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

router.post('/test', requireAuth, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const item = await Notification.create({
      topic: 'Test notification',
      category: 'System',
      country: 'Global',
      mentions: 1,
      message: 'This is a test notification.'
    });
    res.status(201).json({ item: toUserNotification(item.toObject(), req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const item = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user.id } },
      { new: true }
    ).lean();
    res.json({ item: item ? toUserNotification(item, req.user.id) : null });
  } catch (error) {
    next(error);
  }
});

export default router;
