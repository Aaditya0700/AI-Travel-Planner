import { api } from './apiClient.js';

// Matches the routes in server/src/routes/itineraries.js.
export const itineraryService = {
  // Returns the saved itinerary for a trip, or null when the trip does not
  // have one yet.
  //
  // The backend answers 404 both for a trip that is not this user's and for a
  // trip with no itinerary. The caller already has the trip in hand, so a 404
  // here means "nothing generated yet", which is a normal state rather than
  // something to show as an error. Every other failure is raised.
  async getByTripId(tripId) {
    try {
      const data = await api.get(`/api/v1/itineraries/trip/${tripId}`);
      return data.itinerary;
    } catch (error) {
      if (error.status === 404) return null;

      throw error;
    }
  },

  // The number of days and the whole prompt are worked out by the server from
  // the stored trip, so only the id is sent. The stored plan is replaced
  // rather than added to, so this also serves as regenerate.
  async generate(tripId) {
    const data = await api.post('/api/v1/itineraries/generate', { tripId });
    return data.itinerary;
  },
};

// The backend refuses a trip with no dates, because the length of the trip is
// what decides how many days get planned. Checking it here means the button is
// not offered for a trip that could only ever answer with an error.
export function missingDatesReason(trip) {
  if (!trip.startDate || !trip.endDate) {
    return 'This trip needs both a start date and an end date before a day by day plan can be generated.';
  }

  return '';
}

// A day date is stored as a plain YYYY-MM-DD string on purpose. Passing that
// straight to new Date() parses it as UTC midnight, which toLocaleDateString
// would then show as the previous day anywhere behind UTC, so the parts are
// read out and put back together as a local date instead.
export function formatDayDate(value) {
  if (!value) return '';

  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!parts) return value;

  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatGeneratedAt(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
