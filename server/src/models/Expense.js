import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip is required'],
      index: true,
    },
    // The owner is stored on the expense as well as on the trip, so every
    // ownership check is a single query that never loads somebody else's data.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category must be at most 50 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Notes must be at most 500 characters'],
    },
  },
  { timestamps: true }
);

expenseSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    trip: this.trip,
    title: this.title,
    amount: this.amount,
    category: this.category,
    date: this.date,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Expense', expenseSchema);