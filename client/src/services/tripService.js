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

export function formatDate(value) {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
