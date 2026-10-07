import { Router } from 'express';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { generateBudgetPlan } from '../services/geminiBudget.js';
import { GeminiNotConfiguredError } from '../config/gemini.js';
import { GeminiBudgetError } from '../services/geminiBudget.js';

const router = Router();

router.use(protect);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function findOwnTrip(tripId, userId) {
  return Trip.findOne({ _id: tripId, user: userId });
}

router.post('/generate', async (req, res) => {
  const { tripId } = req.body;

  if (!tripId || !isValidId(tripId)) {
    return res.status(400).json({ error: 'A valid tripId is required' });
  }

  try {
    const trip = await findOwnTrip(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'The AI budget planner is not configured on this server' });
    }

    if (trip.budget === null || trip.budget === undefined || trip.budget <= 0) {
      return res.status(400).json({ error: 'This trip does not have a budget set. Please set a trip budget first.' });
    }

    const expenses = await Expense.find({ trip: trip._id, user: req.user.id }).lean();

    const budgetPlan = await generateBudgetPlan(trip, expenses);

    const actualSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        ...budgetPlan,
        actualSpent,
      },
    });
  } catch (error) {
    if (error instanceof GeminiNotConfiguredError) {
      return res.status(503).json({ error: 'The AI budget planner is not configured on this server' });
    }

    if (error instanceof GeminiBudgetError) {
      if (error.code === 'AI_INVALID_RESPONSE') {
        console.warn('[budget-planner] rejected an unusable AI response');
        return res.status(502).json({ error: 'The AI budget planner returned an unusable response' });
      }

      if (error.code === 'AI_UNAVAILABLE') {
        console.error('[budget-planner] AI request failed:', error.message);
        return res.status(502).json({ error: 'The AI budget planner is unavailable right now' });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    console.error('[budget-planner] generate failed:', error.name);

    return res.status(500).json({ error: 'Could not generate the budget plan' });
  }
});

export default router;