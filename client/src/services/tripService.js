import { api } from './apiClient.js';

// Matches the routes in server/src/routes/trips.js.
export const tripService = {
  async list() {
    const data = await api.get('/api/v1/trips');
    return data.trips;
  },

  async getById(id) {
    const data = await api.get(`/api/v1/trips/${id}`);
    return data.trip;
  },

  async create(trip) {
    const data = await api.post('/api/v1/trips', trip);
    return data.trip;
  },

  async update(id, trip) {
    const data = await api.put(`/api/v1/trips/${id}`, trip);
    return data.trip;
  },

  async remove(id) {
    return api.delete(`/api/v1/trips/${id}`);
  },
};

// The rules below are copied from the backend validators in
// server/src/validators/tripValidators.js, so the user gets the same
// feedback before a request is sent.
export const TRIP_STATUSES = ['planned', 'ongoing', 'completed'];
export const DEFAULT_CURRENCY = 'INR';

export function validateTrip(trip) {
  const errors = {};
  const destination = trip.destination.trim();

  if (!destination) {
    errors.destination = 'Destination is required';
  } else if (destination.length < 2 || destination.length > 100) {
    errors.destination = 'Destination must be between 2 and 100 characters';
  }

  if (trip.startDate && Number.isNaN(new Date(trip.startDate).getTime())) {
    errors.startDate = 'Start date must be a valid date';
  }

  if (trip.endDate && Number.isNaN(new Date(trip.endDate).getTime())) {
    errors.endDate = 'End date must be a valid date';
  }

  if (trip.startDate && trip.endDate && new Date(trip.endDate) < new Date(trip.startDate)) {
    errors.endDate = 'End date cannot be before start date';
  }

  if (trip.budget !== '') {
    const budget = Number(trip.budget);

    if (Number.isNaN(budget)) {
      errors.budget = 'Budget must be a number';
    } else if (budget < 0) {
      errors.budget = 'Budget cannot be negative';
    }
  }

  const currency = trip.currency.trim();

  if (currency && currency.length !== 3) {
    errors.currency = 'Currency must be a 3 letter code, for example INR';
  }

  if (trip.notes.length > 500) {
    errors.notes = 'Notes must be at most 500 characters';
  }

  return errors;
}

// Empty optional fields are left out so the backend keeps its own defaults
// (currency INR, status planned) instead of receiving empty strings.
export function toTripPayload(trip) {
  const payload = {
    destination: trip.destination.trim(),
    status: trip.status || 'planned',
  };

  if (trip.startDate) payload.startDate = trip.startDate;
  if (trip.endDate) payload.endDate = trip.endDate;
  if (trip.budget !== '') payload.budget = Number(trip.budget);
  if (trip.currency.trim()) payload.currency = trip.currency.trim().toUpperCase();
  if (trip.notes.trim()) payload.notes = trip.notes.trim();

  return payload;
}

export function emptyTripForm() {
  return {
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: DEFAULT_CURRENCY,
    notes: '',
    status: 'planned',
  };
}

// Dates come back as full ISO timestamps; the inputs need yyyy-mm-dd.
export function toDateInputValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

// The backend stores a chosen day as UTC midnight, so a date handed straight
// to toLocaleDateString would read as the day before anywhere behind UTC. The
// calendar day is taken off the timestamp and rebuilt as a local date, which is
// the same trick the itinerary and the expenses use.
export function formatDate(value) {
  const day = toCalendarDay(value);
  if (!day) return 'Not set';

  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// The yyyy-mm-dd part of an ISO timestamp, or '' when there is no usable date.
export function toCalendarDay(value) {
  if (!value) return '';

  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : '';
}

// A trip is upcoming while it has not finished yet. A trip with no dates is
// left out rather than guessed at, so the count only ever includes trips whose
// dates are actually known.
export function isUpcoming(trip, today = toCalendarDay(new Date().toISOString())) {
  const end = toCalendarDay(trip.endDate);

  return Boolean(end) && end >= today;
}

// A small, real summary for the dashboard: how many trips there are and how
// many of them have not finished. Nothing here is invented, it is all counted
// from the trips that were just loaded.
export function summariseTrips(trips) {
  return {
    total: trips.length,
    upcoming: trips.filter((trip) => isUpcoming(trip)).length,
  };
}
