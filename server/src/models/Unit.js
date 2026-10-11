import mongoose from 'mongoose';
import { UNIT_TYPES } from '../constants.js';

const { Schema } = mongoose;

const unitSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    unitNumber: { type: String, required: true, trim: true },
    type: { type: String, enum: UNIT_TYPES, required: true },
    floor: { type: Number },
    areaSqft: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0 },
    // Only changed by the booking flow, never directly through the API
    status: { type: String, enum: ['available', 'booked'], default: 'available' },
  },
  { timestamps: true }
);

unitSchema.index({ building: 1, unitNumber: 1 }, { unique: true });
unitSchema.index({ project: 1, status: 1 });

export default mongoose.model('Unit', unitSchema);
