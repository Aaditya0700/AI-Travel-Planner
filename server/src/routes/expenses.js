import { Router } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';
import {
  createExpenseRules,
  updateExpenseRules,
  handleValidation,
} from '../validators/expenseValidators.js';

const router = Router();

// Every expense route needs a logged in user.
router.use(protect);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// A schema rule (for example amount cannot be negative) can still fail at the
// database layer. That is the client's mistake, so it is a 400 and not a 500.
function sendSchemaValidationError(res, error) {
  return res.status(400).json({
    error: 'Validation failed',
    details: Object.values(error.errors).map((item) => item.message),
  });
}

// Looks up a trip using both the id and the logged in user's id, so a trip
// owned by somebody else is never found in the first place.
async function findOwnTrip(tripId, userId) {
  return Trip.findOne({ _id: tripId, user: userId });
}

// The same idea for expenses: the owner always comes from the JWT.
async function findOwnExpense(expenseId, userId) {
  return Expense.findOne({ _id: expenseId, user: userId });
}

// This has to be registered before /:id, otherwise "summary" would be read as
// an expense id and answered with a 400.
router.get('/summary', async (req, res) => {
  const { tripId } = req.query;

  if (!tripId || !isValidId(tripId)) {
    return res.status(400).json({ error: 'A valid tripId is required' });
  }

  try {
    const trip = await findOwnTrip(tripId, req.user.id);

    // A missing trip and somebody else's trip give the same answer.
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Adding up the amounts in the database instead of loading every expense
    // into memory. The total is 0 when the trip has no expenses yet.
    const totals = await Expense.aggregate([
      { $match: { trip: trip._id, user: req.user.id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return res.status(200).json({
      tripId: trip._id,
      total: totals.length ? totals[0].total : 0,
      currency: trip.currency,
    });
  } catch (error) {
    console.error('[expenses] summary failed:', error.message);

    return res.status(500).json({ error: 'Could not load the expense summary' });
  }
});

router.post('/', createExpenseRules, handleValidation, async (req, res) => {
  const { tripId, title, amount, category, date, notes } = req.body;

  try {
    // An expense can only be created under a trip that belongs to the logged in
    // user. A trip that does not exist and a trip owned by somebody else both
    // come back as 404, so the API never confirms that another trip exists.
    const trip = await findOwnTrip(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // The owner always comes from the JWT. Any user or userId sent in the body
    // is ignored, and the verified trip id is what gets stored.
    const expense = await Expense.create({
      trip: trip._id,
      user: req.user.id,
      title,
      amount,
      category,
      date,
      notes,
    });

    return res.status(201).json({
      message: 'Expense created successfully',
      expense: expense.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendSchemaValidationError(res, error);
    }

    console.error('[expenses] create failed:', error.message);

    return res.status(500).json({ error: 'Could not create the expense' });
  }
});

router.get('/', async (req, res) => {
  const { tripId } = req.query;

  if (tripId !== undefined && !isValidId(tripId)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    // A filter narrows the results to one trip, but the owner is always part of
    // the query, so somebody else's expenses can never be listed.
    const query = { user: req.user.id };

    if (tripId !== undefined) {
      const trip = await findOwnTrip(tripId, req.user.id);

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      query.trip = trip._id;
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      count: expenses.length,
      expenses: expenses.map((expense) => expense.toPublicJSON()),
    });
  } catch (error) {
    console.error('[expenses] list failed:', error.message);

    return res.status(500).json({ error: 'Could not load your expenses' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  try {
    const expense = await findOwnExpense(id, req.user.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.status(200).json({ expense: expense.toPublicJSON() });
  } catch (error) {
    console.error('[expenses] get one failed:', error.message);

    return res.status(500).json({ error: 'Could not load the expense' });
  }
});

router.put('/:id', updateExpenseRules, handleValidation, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  try {
    const expense = await findOwnExpense(id, req.user.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { title, amount, category, date, notes } = req.body;

    // Only these fields can change. The owner (user) and the trip are read
    // from the stored document, so a client cannot move an expense to another
    // trip or hand it to somebody else.
    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    return res.status(200).json({
      message: 'Expense updated successfully',
      expense: expense.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendSchemaValidationError(res, error);
    }

    console.error('[expenses] update failed:', error.message);

    return res.status(500).json({ error: 'Could not update the expense' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  try {
    const expense = await findOwnExpense(id, req.user.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expense.deleteOne();

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('[expenses] delete failed:', error.message);

    return res.status(500).json({ error: 'Could not delete the expense' });
  }
});

export default router;