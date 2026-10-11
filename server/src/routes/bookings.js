import { Router } from 'express';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import Unit from '../models/Unit.js';
import { protect } from '../middleware/auth.js';
import { ApiError, asyncHandler, validate } from '../utils/http.js';

const router = Router();
router.use(protect);

const populateBooking = [
  { path: 'lead', select: 'name phone' },
  { path: 'bookedBy', select: 'name' },
  { path: 'unit', populate: [{ path: 'project', select: 'name' }, { path: 'building', select: 'name' }] },
];

router.get('/', asyncHandler(async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { bookedBy: req.user._id };
  if (req.query.status) q.status = req.query.status;
  res.json(await Booking.find(q).populate(populateBooking).sort({ createdAt: -1 }).limit(200).lean());
}));

router.post('/', validate(z.object({
  leadId: z.string().min(1),
  unitId: z.string().min(1),
  tokenAmount: z.coerce.number().min(0).default(0),
})), asyncHandler(async (req, res) => {
  const { leadId, unitId, tokenAmount } = req.body;

  // Sales can only book for their own leads
  const scope = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };
  const lead = await Lead.findOne({ _id: leadId, ...scope });
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (lead.stage === 'Lost') throw new ApiError(400, 'This lead is marked Lost. Re-open it before booking');
  if (await Booking.exists({ lead: lead._id, status: 'active' })) {
    throw new ApiError(409, 'This lead already has an active booking');
  }

  // ATOMIC claim: only one request can flip available -> booked.
  // A second user booking the same unit gets null here and a 409.
  const unit = await Unit.findOneAndUpdate({ _id: unitId, status: 'available' }, { status: 'booked' }, { new: true });
  if (!unit) throw new ApiError(409, 'Sorry, this unit is no longer available');

  try {
    const booking = await Booking.create({
      lead: lead._id,
      unit: unit._id,
      bookedBy: req.user._id,
      price: unit.price,
      tokenAmount,
    });
    lead.stage = 'Booked';
    await lead.save();
    res.status(201).json(booking);
  } catch (err) {
    await Unit.updateOne({ _id: unit._id }, { status: 'available' }); // roll back the claim
    if (err.code === 11000) throw new ApiError(409, 'This unit was just booked by someone else');
    throw err;
  }
}));

router.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, status: 'active' });
  if (!booking) throw new ApiError(404, 'Active booking not found');
  if (req.user.role !== 'admin' && String(booking.bookedBy) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the booking owner or an admin can cancel this');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  await Unit.updateOne({ _id: booking.unit }, { status: 'available' });
  await Lead.updateOne({ _id: booking.lead }, { stage: 'Negotiation' });
  res.json(booking);
}));

export default router;
