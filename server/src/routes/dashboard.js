import { Router } from 'express';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Unit from '../models/Unit.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { STAGES } from '../constants.js';

const router = Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const leadScope = isAdmin ? {} : { assignedTo: req.user._id };
  const bookingScope = isAdmin ? {} : { bookedBy: req.user._id };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const open = { stage: { $nin: ['Booked', 'Lost'] } };

  const [stageAgg, todayCount, overdueCount, followUps, monthAgg, inventoryAgg] = await Promise.all([
    Lead.aggregate([{ $match: leadScope }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Lead.countDocuments({ ...leadScope, ...open, followUpDate: { $gte: startOfDay, $lt: endOfDay } }),
    Lead.countDocuments({ ...leadScope, ...open, followUpDate: { $lt: startOfDay } }),
    Lead.find({ ...leadScope, ...open, followUpDate: { $lt: endOfDay } })
      .sort({ followUpDate: 1 })
      .limit(8)
      .populate('assignedTo', 'name')
      .select('name phone stage followUpDate assignedTo')
      .lean(),
    Booking.aggregate([
      { $match: { ...bookingScope, status: 'active', bookingDate: { $gte: startOfMonth } } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$price' } } },
    ]),
    Unit.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const stages = Object.fromEntries(STAGES.map((s) => [s, stageAgg.find((a) => a._id === s)?.count || 0]));
  const inv = (s) => inventoryAgg.find((a) => a._id === s)?.count || 0;

  res.json({
    totalLeads: Object.values(stages).reduce((a, b) => a + b, 0),
    stages,
    followUpsToday: todayCount,
    overdue: overdueCount,
    followUps,
    bookingsThisMonth: { count: monthAgg[0]?.count || 0, value: monthAgg[0]?.value || 0 },
    inventory: { available: inv('available'), booked: inv('booked') },
  });
}));

export default router;
