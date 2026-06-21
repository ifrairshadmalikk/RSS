import express from 'express';
import { Notification } from '../models/Notification.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const item = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

export default router;
