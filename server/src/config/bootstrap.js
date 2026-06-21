import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function bootstrapAdminFromEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@trends.local');
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123456');
  if (!adminEmail || !adminPassword) return;

  const email = adminEmail.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    const updates = {};
    if (existing.role !== 'admin') updates.role = 'admin';
    if (adminName && existing.name !== adminName) updates.name = adminName;
    if (Object.keys(updates).length) {
      await User.findByIdAndUpdate(existing._id, updates);
    }
    return;
  }

  await User.create({
    name: adminName,
    email,
    password: await bcrypt.hash(adminPassword, 12),
    role: 'admin'
  });
}
