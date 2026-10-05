import { Router } from 'express';
import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { generateItineraryDays } from '../services/geminiItinerary.js';
import {
  generateItineraryRules,
  handleValidation,
} from '../validators/itineraryValidators.js';

const router = Router();

// Every itinerary route needs a logged in user.
router.use(protect);

// A very long trip would produce an enormous response and a large bill, so it is
// refused rather than generated.
const MAX_DAYS = 14;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Same idea as the other routes: the trip is looked up with the owner's id, so
// somebody else's trip is never found and never confirmed to exist.
async function findOwnTrip(tripId, userId) {
  return Trip.findOne({ _id: tripId, user: userId });
}

function sendSchemaValidationError(res, error) {
  return res.status(400).json({
    error: 'Validation failed',
    details: Object.values(error.errors).map((item) => item.message),
  });
}

router.post('/generate', generateItineraryRules, handleValidation, async (req, res) => {
  const { tripId } = req.body;
  let days;
  try {
    // The owner always comes from the token, never from the request body.
    const trip = await findOwnTrip(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // numberOfDays is worked out from the trip dates, so a trip with no dates
    // has nothing to plan a day by day itinerary around.
    const numberOfDays = trip.numberOfDays;

    if (!numberOfDays) {
      return res
        .status(400)
        .json({ error: 'The trip needs both a start date and an end date' });
    }

    if (numberOfDays > MAX_DAYS) {
      return res
        .status(400)
        .json({ error: `Trips longer than ${MAX_DAYS} days cannot be planned` });
    }

    // Checked before spending any time on a call that is going to fail.
    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'The AI planner is not configured on this server' });
    }

     days = await generateItineraryDays(trip, numberOfDays);

    // One itinerary per trip. The unique index on trip is the real guarantee,
    // and this upsert replaces the stored plan instead of adding a second one.
    const itinerary = await Itinerary.findOneAndUpdate(
      { trip: trip._id, user: req.user.id },
      { $set: { days, model: process.env.GEMINI_MODEL } },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: 'Itinerary generated successfully',
      itinerary: itinerary.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'GeminiNotConfiguredError') {
      return res.status(503).json({ error: 'The AI planner is not configured on this server' });
    }

    // The model answered with something unusable, or could not be reached.
    // Only the code is used here so nothing from Gemini reaches the client.
    if (error.code === 'AI_INVALID_RESPONSE') {
      console.warn('[itineraries] rejected an unusable AI response');

      return res.status(502).json({ error: 'The AI planner returned an unusable response' });
    }

    if (error.code === 'AI_UNAVAILABLE') {
      console.error('[itineraries] AI request failed:', error.message);

      return res.status(502).json({ error: 'The AI planner is unavailable right now' });
    }

    if (error.name === 'ValidationError') {
      return sendSchemaValidationError(res, error);
    }

    // A second generate request that raced the first one can collide on the
    // unique index, so the update is simply repeated without the upsert.
    if (error.code === 11000) {
      try {
        const itinerary = await Itinerary.findOneAndUpdate(
          { trip: trip._id, user: req.user.id },
          { $set: { days, model: process.env.GEMINI_MODEL } },
          { returnDocument: 'after', runValidators: true }
        );

        return res.status(200).json({
          message: 'Itinerary generated successfully',
          itinerary: itinerary.toPublicJSON(),
        });
      } catch (retryError) {
        console.error('[itineraries] save retry failed:', retryError.name);
      }
    }

    console.error('[itineraries] generate failed:', error.name);

    return res.status(500).json({ error: 'Could not generate the itinerary' });
  }
});

router.get('/', async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.user.id }).sort({ updatedAt: -1 });

    return res.status(200).json({
      count: itineraries.length,
      itineraries: itineraries.map((itinerary) => itinerary.toPublicJSON()),
    });
  } catch (error) {
    console.error('[itineraries] list failed:', error.name);

    return res.status(500).json({ error: 'Could not load your itineraries' });
  }
});

router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;

  if (!isValidId(tripId)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    // The trip is checked first so a foreign trip answers 404 in exactly the
    // same way a trip that does not exist does.
    const trip = await findOwnTrip(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const itinerary = await Itinerary.findOne({ trip: trip._id, user: req.user.id });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    return res.status(200).json({ itinerary: itinerary.toPublicJSON() });
  } catch (error) {
    console.error('[itineraries] get one failed:', error.name);

    return res.status(500).json({ error: 'Could not load the itinerary' });
  }
});

export default router;
