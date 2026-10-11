import mongoose from 'mongoose';
import { STAGES, SOURCES } from '../constants.js';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true }, // unique => no duplicate leads
    email: { type: String, trim: true, lowercase: true },
    source: { type: String, enum: SOURCES, default: 'Other' },
    budget: { type: Number, min: 0 },
    stage: { type: String, enum: STAGES, default: 'New' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    followUpDate: { type: Date, default: null },
    notes: [noteSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ followUpDate: 1 });

export default mongoose.model('Lead', leadSchema);
