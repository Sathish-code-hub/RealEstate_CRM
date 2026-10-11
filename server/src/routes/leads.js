import { Router } from 'express';
import { z } from 'zod';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { ApiError, asyncHandler, validate } from '../utils/http.js';
import { STAGES, SOURCES } from '../constants.js';

const router = Router();
router.use(protect);

// Admin sees everything, sales only sees leads assigned to them
const scope = (user) => (user.role === 'admin' ? {} : { assignedTo: user._id });
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Enter a valid phone number'));

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone,
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  source: z.enum(SOURCES).optional(),
  budget: z.coerce.number().min(0).optional(),
  stage: z.enum(STAGES).optional(),
  assignedTo: z.string().optional().nullable(),
  followUpDate: z.coerce.date().nullable().optional(),
});

async function assertAssignable(userId) {
  if (!userId) return;
  const u = await User.findById(userId);
  if (!u || !u.active) throw new ApiError(400, 'Selected employee is not available');
}

// LIST: search, filters, pagination
router.get('/', asyncHandler(async (req, res) => {
  const { search, stage, assignedTo, followUp, page = 1, limit = 10 } = req.query;
  const q = { ...scope(req.user) };

  if (stage) q.stage = stage;
  if (assignedTo && req.user.role === 'admin') q.assignedTo = assignedTo;
  if (search) {
    const rx = new RegExp(escapeRx(search), 'i');
    q.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  if (followUp === 'today') q.followUpDate = { $gte: startOfDay, $lt: endOfDay };
  if (followUp === 'overdue') {
    q.followUpDate = { $lt: startOfDay };
    if (!stage) q.stage = { $nin: ['Booked', 'Lost'] };
  }

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Number(limit) || 10);
  const [items, total] = await Promise.all([
    Lead.find(q).populate('assignedTo', 'name').sort({ updatedAt: -1 }).skip((p - 1) * l).limit(l).lean(),
    Lead.countDocuments(q),
  ]);
  res.json({ items, total, page: p, pages: Math.ceil(total / l) || 1 });
}));

// CREATE
router.post('/', validate(leadSchema), asyncHandler(async (req, res) => {
  const data = req.body;
  if (data.stage === 'Booked') throw new ApiError(400, 'Use the booking flow to mark a lead as Booked');

  // Sales employees always own the leads they create; admins can pick (or leave unassigned)
  data.assignedTo = req.user.role === 'admin' ? data.assignedTo || null : req.user._id;
  await assertAssignable(data.assignedTo);

  const lead = await Lead.create({ ...data, createdBy: req.user._id });
  res.status(201).json(lead);
}));

// DETAIL (+ active booking if any)
router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...scope(req.user) })
    .populate('assignedTo', 'name')
    .populate('notes.by', 'name')
    .lean();
  if (!lead) throw new ApiError(404, 'Lead not found');

  const booking = await Booking.findOne({ lead: lead._id, status: 'active' })
    .populate({ path: 'unit', populate: [{ path: 'project', select: 'name' }, { path: 'building', select: 'name' }] })
    .lean();
  res.json({ lead, booking });
}));

// UPDATE
router.patch('/:id', validate(leadSchema.partial()), asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const d = req.body;
  if (req.user.role !== 'admin') delete d.assignedTo; // only admin can reassign
  if (d.stage && d.stage !== lead.stage) {
    if (d.stage === 'Booked') throw new ApiError(400, 'Use the booking flow to mark a lead as Booked');
    if (lead.stage === 'Booked') throw new ApiError(400, "Cancel the booking before changing this lead's stage");
  }
  if ('assignedTo' in d) {
    d.assignedTo = d.assignedTo || null;
    await assertAssignable(d.assignedTo);
  }

  Object.assign(lead, d);
  await lead.save();
  res.json(lead);
}));

// ADD NOTE
router.post('/:id/notes', validate(z.object({ text: z.string().trim().min(1, 'Write a note first').max(1000) })), asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!lead) throw new ApiError(404, 'Lead not found');
  lead.notes.push({ text: req.body.text, by: req.user._id });
  await lead.save();
  res.status(201).json({ ok: true });
}));

export default router;
