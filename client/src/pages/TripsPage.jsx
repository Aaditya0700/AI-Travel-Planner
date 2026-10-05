import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import {
  tripService,
  formatDate,
  emptyTripForm,
  validateTrip,
  toTripPayload,
  summariseTrips,
  isUpcoming,
} from '../services/tripService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import TripForm from '../components/TripForm.jsx';

export default function TripsPage() {
  const { user, handleUnauthorized } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTripForm());
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bumped to ask the loader below to run again, which is how the "Try again"
  // button recovers from a failed request.
  const [reloadCount, setReloadCount] = useState(0);

  function handleReload() {
    setReloadCount((count) => count + 1);
  }

  // Both numbers are counted from the loaded trips, so they can never disagree
  // with the list below them.
  const summary = summariseTrips(trips);

  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await tripService.list();

        if (!cancelled) setTrips(data);
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!cancelled) setLoadError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrips();

    return () => {
      cancelled = true;
    };
  }, [handleUnauthorized, reloadCount]);

  // The submit event arrives from TripForm, which has already stopped the
  // browser's own submit, so there is nothing to prevent here.
  async function handleCreate() {
    setSaveError(null);

    const found = validateTrip(form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const created = await tripService.create(toTripPayload(form));

      setTrips((current) => [created, ...current]);
      setForm(emptyTripForm());
      setErrors({});
      setShowForm(false);
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }

      setSaveError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Your trips</h1>
          <p className="page-subtitle">
            {user && `Signed in as ${user.email}`}
            {summary.total > 0 && (
              <>
                {' · '}
                {summary.total} {summary.total === 1 ? 'trip' : 'trips'}
                {summary.upcoming > 0 && `, ${summary.upcoming} still to come`}
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowForm((open) => !open);
            setErrors({});
            setSaveError(null);
          }}
        >
          {showForm ? 'Close form' : 'Add trip'}
        </button>
      </div>

      {showForm && (
        <section className="card">
          <h2>New trip</h2>
          <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />
          <TripForm
            form={form}
            onChange={setForm}
            errors={errors}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitLabel={saving ? 'Creating trip...' : 'Create trip'}
          />
        </section>
      )}

      {loading && (
        <div className="page-loading">
          <Spinner label="Loading your trips..." />
        </div>
      )}

      {!loading && loadError && (
        <>
          <ErrorMessage error={loadError} onDismiss={() => setLoadError(null)} />
          <div className="empty-state">
            <h2>Your trips could not be loaded</h2>
            <p>Check your connection and try again.</p>
            <button type="button" className="btn btn-primary" onClick={handleReload}>
              Try again
            </button>
          </div>
        </>
      )}

      {!loading && !loadError && trips.length === 0 && (
        <div className="empty-state">
          <h2>No trips yet</h2>
          <p>Add your first trip to start planning expenses and a day by day itinerary.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add trip
          </button>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id} className="trip-card">
              <div className="trip-card-main">
                <h3>
                  {/* The whole card is a link, so the destination reads as the
                      heading and stays keyboard reachable. */}
                  <Link to={`/trips/${trip.id}`}>{trip.destination}</Link>
                </h3>
                <p className="trip-card-dates">
                  {formatDate(trip.startDate)} &rarr; {formatDate(trip.endDate)}
                </p>
                <div className="trip-card-tags">
                  <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                  {trip.numberOfDays && (
                    <span className="badge">
                      {trip.numberOfDays} {trip.numberOfDays === 1 ? 'day' : 'days'}
                    </span>
                  )}
                  {isUpcoming(trip) && trip.status !== 'completed' && (
                    <span className="badge badge-upcoming">upcoming</span>
                  )}
                  {trip.budget !== null && trip.budget !== undefined && (
                    <span className="badge">
                      {trip.budget} {trip.currency}
                    </span>
                  )}
                </div>
              </div>

              <Link to={`/trips/${trip.id}`} className="btn btn-ghost">
                View
                <span className="visually-hidden"> {trip.destination}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
