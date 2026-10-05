import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { tripService, formatDate, emptyTripForm, validateTrip, toTripPayload } from '../services/tripService.js';
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
  }, [handleUnauthorized]);

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
          {user && <p className="page-subtitle">Signed in as {user.email}</p>}
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
        <ErrorMessage error={loadError} onDismiss={() => setLoadError(null)} />
      )}

      {!loading && !loadError && trips.length === 0 && (
        <div className="empty-state">
          <h2>No trips yet</h2>
          <p>Add your first trip to start planning.</p>
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
                  <Link to={`/trips/${trip.id}`}>{trip.destination}</Link>
                </h3>
                <p className="trip-card-dates">
                  {formatDate(trip.startDate)} &rarr; {formatDate(trip.endDate)}
                </p>
                <div className="trip-card-tags">
                  <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                  {trip.numberOfDays && <span className="badge">{trip.numberOfDays} days</span>}
                  {trip.budget !== null && (
                    <span className="badge">
                      {trip.budget} {trip.currency}
                    </span>
                  )}
                </div>
              </div>

              <Link to={`/trips/${trip.id}`} className="btn btn-ghost">
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
