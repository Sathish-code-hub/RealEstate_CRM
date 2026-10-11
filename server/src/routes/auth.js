import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { ApiError, asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.post(
  '/login',
  validate(z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') })),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !user.active || !(await user.matches(req.body.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

export default router;
