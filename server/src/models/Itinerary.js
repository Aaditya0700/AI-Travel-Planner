import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: [true, 'Activity time is required'],
      trim: true,
      maxlength: [5, 'Activity time must be at most 5 characters, for example 09:30'],
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [150, 'Activity title must be at most 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
      maxlength: [1000, 'Activity description must be at most 1000 characters'],
    },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: [true, 'Day number is required'],
      min: [1, 'Day number must be 1 or more'],
    },
    // Kept as a plain YYYY-MM-DD string on purpose. Storing a Date would let
    // timezone conversion move an itinerary day onto the wrong calendar day.
    date: {
      type: String,
      required: [true, 'Day date is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Day date must look like 2026-10-10'],
    },
    title: {
      type: String,
      required: [true, 'Day title is required'],
      trim: true,
      maxlength: [200, 'Day title must be at most 200 characters'],
    },
    activities: {
      type: [activitySchema],
      default: [],
    },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip is required'],
      index: true,
      // One itinerary per trip. The unique index is what actually stops a
      // second generate request from creating a duplicate document.
      unique: true,
    },
    days: {
      type: [daySchema],
      default: [],
    },
    // Recorded so it is clear which model produced an itinerary.
    model: {
      type: String,
      default: null,
      trim: true,
      maxlength: [60, 'Model name must be at most 60 characters'],
    },
  },
  { timestamps: true }
);

itinerarySchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    trip: this.trip,
    model: this.model,
    days: this.days.map((day) => ({
      day: day.day,
      date: day.date,
      title: day.title,
      activities: day.activities.map((activity) => ({
        time: activity.time,
        title: activity.title,
        description: activity.description,
      })),
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Itinerary', itinerarySchema);
