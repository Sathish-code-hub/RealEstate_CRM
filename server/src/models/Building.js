import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    floors: { type: Number, min: 1 },
  },
  { timestamps: true }
);

buildingSchema.index({ project: 1, name: 1 }, { unique: true });

export default mongoose.model('Building', buildingSchema);
