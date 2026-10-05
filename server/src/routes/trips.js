import { Router } from 'express';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';
import {
  createTripRules,
  updateTripRules,
  handleValidation,
} from '../validators/tripValidators.js';

const router = Router();

// Every trip route needs a logged in user.
router.use(protect);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function endDateIsBeforeStart(startDate, endDate) {
  if (!startDate || !endDate) {
    return false;
  }

  return new Date(endDate) < new Date(startDate);
}

// A schema rule (for example budget cannot be negative) can still fail at the
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

router.post('/', createTripRules, handleValidation, async (req, res) => {
  const { destination, startDate, endDate, budget, currency, notes, status } = req.body;

  if (endDateIsBeforeStart(startDate, endDate)) {
    return res.status(400).json({ error: 'End date cannot be before start date' });
  }

  try {
    // The owner always comes from the JWT, never from the request body.
    const trip = await Trip.create({
      user: req.user.id,
      destination,
      startDate,
      endDate,
      budget,
      currency,
      notes,
      status,
    });

    return res.status(201).json({
      message: 'Trip created successfully',
      trip: trip.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendSchemaValidationError(res, error);
    }

    console.error('[trips] create failed:', error.message);

    return res.status(500).json({ error: 'Could not create the trip' });
  }
});

router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: trips.length,
      trips: trips.map((trip) => trip.toPublicJSON()),
    });
  } catch (error) {
    console.error('[trips] list failed:', error.message);

    return res.status(500).json({ error: 'Could not load your trips' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await findOwnTrip(id, req.user.id);

    // Missing trip and somebody else's trip give the same answer,
    // so the API never confirms that another user's trip exists.
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json({ trip: trip.toPublicJSON() });
  } catch (error) {
    console.error('[trips] get one failed:', error.message);

    return res.status(500).json({ error: 'Could not load the trip' });
  }
});

router.put('/:id', updateTripRules, handleValidation, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await findOwnTrip(id, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { destination, startDate, endDate, budget, currency, notes, status } = req.body;

    // Compare the final dates, because a client may send only one of them.
    const finalStartDate = startDate !== undefined ? startDate : trip.startDate;
    const finalEndDate = endDate !== undefined ? endDate : trip.endDate;

    if (endDateIsBeforeStart(finalStartDate, finalEndDate)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    // Only these fields can change. The owner (user) is never updated.
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (budget !== undefined) trip.budget = budget;
    if (currency !== undefined) trip.currency = currency;
    if (notes !== undefined) trip.notes = notes;
    if (status !== undefined) trip.status = status;

    await trip.save();

    return res.status(200).json({
      message: 'Trip updated successfully',
      trip: trip.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendSchemaValidationError(res, error);
    }

    console.error('[trips] update failed:', error.message);

    return res.status(500).json({ error: 'Could not update the trip' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await findOwnTrip(id, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await trip.deleteOne();

    return res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('[trips] delete failed:', error.message);

    return res.status(500).json({ error: 'Could not delete the trip' });
  }
});

export default router;