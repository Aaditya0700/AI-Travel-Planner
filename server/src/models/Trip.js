import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      minlength: [2, 'Destination must be at least 2 characters'],
      maxlength: [100, 'Destination must be at most 100 characters'],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    budget: {
      type: Number,
      default: null,
      min: [0, 'Budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
      maxlength: [3, 'Currency must be a 3 letter code, for example INR'],
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Notes must be at most 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['planned', 'ongoing', 'completed'],
        message: 'Status must be planned, ongoing or completed',
      },
      default: 'planned',
    },
  },
  { timestamps: true }
);

// numberOfDays is worked out from the dates instead of being stored,
// so it can never go out of date. Both end days are counted, so
// 10 Dec to 14 Dec is 5 days.
tripSchema.virtual('numberOfDays').get(function numberOfDays() {
  if (!this.startDate || !this.endDate) {
    return null;
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const differenceInDays = Math.round((this.endDate - this.startDate) / oneDay);

  return differenceInDays + 1;
});

tripSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    destination: this.destination,
    startDate: this.startDate,
    endDate: this.endDate,
    numberOfDays: this.numberOfDays,
    budget: this.budget,
    currency: this.currency,
    notes: this.notes,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Trip', tripSchema);