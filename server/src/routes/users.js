import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.js';
import { ApiError, asyncHandler, validate } from '../utils/http.js';

const router = Router();
router.use(protect, requireRole('admin')); // admin

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'sales']).default('sales'),
});

router.get('/', asyncHandler(async (req, res) => {
  res.json(await User.find().sort({ role: 1, name: 1 }));
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, active: user.active });
}));

router.patch('/:id', validate(createSchema.partial().extend({ active: z.boolean().optional() })), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (req.params.id === String(req.user._id) && (req.body.active === false || req.body.role === 'sales')) {
    throw new ApiError(400, 'You cannot disable or demote your own account');
  }
  Object.assign(user, req.body);
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, active: user.active });
}));

export default router;
