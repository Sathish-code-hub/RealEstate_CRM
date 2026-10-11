import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true }, // snapshot of unit price at booking time
    tokenAmount: { type: Number, default: 0, min: 0 },
    bookingDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Safety net: the database itself refuses a 2nd ACTIVE booking for the same unit
bookingSchema.index({ unit: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
bookingSchema.index({ lead: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
