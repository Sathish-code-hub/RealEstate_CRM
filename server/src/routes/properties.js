import { Router } from 'express';
import { z } from 'zod';
import Project from '../models/Project.js';
import Building from '../models/Building.js';
import Unit from '../models/Unit.js';
import { protect, requireRole } from '../middleware/auth.js';
import { ApiError, asyncHandler, validate } from '../utils/http.js';
import { UNIT_TYPES } from '../constants.js';

const router = Router();
router.use(protect);
const admin = requireRole('admin');

// ---- Projects (with availability stats)
router.get('/projects', asyncHandler(async (req, res) => {
  const [projects, stats] = await Promise.all([
    Project.find().sort({ name: 1 }).lean(),
    Unit.aggregate([{ $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } }]),
  ]);
  const withStats = projects.map((p) => {
    const mine = stats.filter((s) => String(s._id.project) === String(p._id));
    const get = (st) => mine.find((s) => s._id.status === st)?.count || 0;
    return { ...p, available: get('available'), booked: get('booked'), total: get('available') + get('booked') };
  });
  res.json(withStats);
}));

router.post('/projects', admin, validate(z.object({
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
  description: z.string().trim().optional(),
})), asyncHandler(async (req, res) => {
  res.status(201).json(await Project.create(req.body));
}));

// ---- Buildings
router.get('/buildings', asyncHandler(async (req, res) => {
  const q = req.query.project ? { project: req.query.project } : {};
  res.json(await Building.find(q).sort({ name: 1 }).lean());
}));

router.post('/buildings', admin, validate(z.object({
  project: z.string().min(1, 'Select a project'),
  name: z.string().trim().min(1),
  floors: z.coerce.number().int().min(1).optional(),
})), asyncHandler(async (req, res) => {
  if (!(await Project.exists({ _id: req.body.project }))) throw new ApiError(404, 'Project not found');
  res.status(201).json(await Building.create(req.body));
}));

// ---- Units
router.get('/units', asyncHandler(async (req, res) => {
  const { project, building, status, type, minPrice, maxPrice } = req.query;
  const q = {};
  if (project) q.project = project;
  if (building) q.building = building;
  if (status) q.status = status;
  if (type) q.type = type;
  if (minPrice || maxPrice) {
    q.price = {};
    if (minPrice) q.price.$gte = Number(minPrice);
    if (maxPrice) q.price.$lte = Number(maxPrice);
  }
  const units = await Unit.find(q)
    .populate('project', 'name')
    .populate('building', 'name')
    .sort({ building: 1, unitNumber: 1 })
    .limit(300)
    .lean();
  res.json(units);
}));

const unitFields = {
  type: z.enum(UNIT_TYPES),
  floor: z.coerce.number().int().optional(),
  areaSqft: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
};

router.post('/units', admin, validate(z.object({
  building: z.string().min(1, 'Select a building'),
  unitNumber: z.string().trim().min(1, 'Unit number is required'),
  ...unitFields,
})), asyncHandler(async (req, res) => {
  const building = await Building.findById(req.body.building);
  if (!building) throw new ApiError(404, 'Building not found');
  res.status(201).json(await Unit.create({ ...req.body, project: building.project }));
}));

// Status is intentionally NOT editable here: only bookings change availability
router.patch('/units/:id', admin, validate(z.object(unitFields).partial()), asyncHandler(async (req, res) => {
  const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!unit) throw new ApiError(404, 'Unit not found');
  res.json(unit);
}));

export default router;
