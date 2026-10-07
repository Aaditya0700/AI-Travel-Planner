import { Router } from 'express';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Expense from '../models/Expense.js';
import Itinerary from '../models/Itinerary.js';
import { protect } from '../middleware/auth.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { sendChatMessage } from '../services/geminiChat.js';
import { GeminiNotConfiguredError } from '../config/gemini.js';
import { GeminiChatError } from '../services/geminiChat.js';

const router = Router();

router.use(protect);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function findOwnTrip(tripId, userId) {
  return Trip.findOne({ _id: tripId, user: userId });
}

router.post('/', async (req, res) => {
  const { tripId, message, history = [] } = req.body;

  if (!tripId || !isValidId(tripId)) {
    return res.status(400).json({ error: 'A valid tripId is required' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (trimmedMessage.length > 1000) {
    return res.status(400).json({ error: 'Message must be at most 1000 characters' });
  }

  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'History must be an array' });
  }

  try {
    const trip = await findOwnTrip(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'The AI assistant is not configured on this server' });
    }

    const [expenses, itinerary] = await Promise.all([
      Expense.find({ trip: trip._id, user: req.user.id }).lean(),
      Itinerary.findOne({ trip: trip._id, user: req.user.id }).lean(),
    ]);

    const reply = await sendChatMessage(trip, expenses, itinerary, history, trimmedMessage);

    return res.status(200).json({ reply });
  } catch (error) {
    if (error instanceof GeminiNotConfiguredError) {
      return res.status(503).json({ error: 'The AI assistant is not configured on this server' });
    }

    if (error instanceof GeminiChatError) {
      if (error.code === 'INVALID_MESSAGE') {
        return res.status(400).json({ error: error.message });
      }

      if (error.code === 'AI_INVALID_RESPONSE') {
        console.warn('[chat] rejected an unusable AI response');
        return res.status(502).json({ error: 'The AI assistant returned an unusable response' });
      }

      if (error.code === 'AI_UNAVAILABLE') {
        console.error('[chat] AI request failed:', error.message);
        return res.status(502).json({ error: 'The AI assistant is unavailable right now' });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    console.error('[chat] send failed:', error.name);

    return res.status(500).json({ error: 'Could not get a response from the AI assistant' });
  }
});

export default router;