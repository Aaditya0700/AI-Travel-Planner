import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import {
  tripService,
  formatDate,
  validateTrip,
  toTripPayload,
  toDateInputValue,
} from '../services/tripService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import TripForm from '../components/TripForm.jsx';
import ItinerarySection from '../components/ItinerarySection.jsx';

function toForm(trip) {
  return {
    destination: trip.destination || '',
    startDate: toDateInputValue(trip.startDate),
    endDate: toDateInputValue(trip.endDate),
    budget: trip.budget === null || trip.budget === undefined ? '' : String(trip.budget),
    currency: trip.currency || '',
    notes: trip.notes || '',
    status: trip.status || 'planned',
  };
}

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleUnauthorized } = useAuth();

  const [trip, setTrip] = useState(null);
  // The error carries the id it belongs to, so switching trips in the URL
  // never shows the previous trip's message.
  const [loadError, setLoadError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Loading is derived: we are still waiting when the stored trip is not the
  // one this URL asks for, and the request has not already failed.
  const loading = trip?.id !== id && !(loadError && loadError.tripId === id);

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      try {
        const data = await tripService.getById(id);

        if (!cancelled) setTrip(data);
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401) {
          handleUnauthorized();
          return;
        }

        setLoadError({ tripId: id, error });
      }
    }

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, [id, handleUnauthorized]);

  function startEditing() {
    setForm(toForm(trip));
    setErrors({});
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
    setErrors({});
    setSaveError(null);
  }

  // The submit event arrives from TripForm, which has already stopped the
  // browser's own submit, so there is nothing to prevent here.
  async function handleUpdate() {
    setSaveError(null);

    const found = validateTrip(form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const updated = await tripService.update(id, toTripPayload(form));

      setTrip(updated);
      setEditing(false);
      setForm(null);
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

  async function handleDelete() {
    if (!window.confirm('Delete this trip? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await tripService.remove(id);
      navigate('/trips', { replace: true });
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }

      setDeleteError(error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <Spinner label="Loading trip..." />
        </div>
      </div>
    );
  }

  // Only show the error while it belongs to the trip in the URL.
  // loadError && guards the case where there is no error at all.
  if (loadError && loadError.tripId === id) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Trip not available</h1>
        </div>
        <ErrorMessage error={loadError.error} />
        <Link to="/trips" className="btn btn-ghost">
          Back to trips
        </Link>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/trips" className="back-link">
            &larr; All trips
          </Link>
          <h1>{trip.destination}</h1>
        </div>

        {!editing && (
          <div className="header-actions">
            <button type="button" className="btn btn-ghost" onClick={startEditing}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Spinner label="Deleting..." /> : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <ErrorMessage error={deleteError} onDismiss={() => setDeleteError(null)} />

      {editing ? (
        <section className="card">
          <h2>Edit trip</h2>
          <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />
          <TripForm
            form={form}
            onChange={setForm}
            errors={errors}
            onSubmit={handleUpdate}
            onCancel={cancelEditing}
            submitLabel={saving ? 'Saving...' : 'Save changes'}
          />
        </section>
      ) : (
        <section className="card">
          <h2>Trip details</h2>

          <dl className="detail-list">
            <div className="detail-row">
              <dt>Destination</dt>
              <dd>{trip.destination}</dd>
            </div>
            <div className="detail-row">
              <dt>Start date</dt>
              <dd>{formatDate(trip.startDate)}</dd>
            </div>
            <div className="detail-row">
              <dt>End date</dt>
              <dd>{formatDate(trip.endDate)}</dd>
            </div>
            <div className="detail-row">
              <dt>Length</dt>
              <dd>{trip.numberOfDays ? `${trip.numberOfDays} days` : 'Not set'}</dd>
            </div>
            <div className="detail-row">
              <dt>Budget</dt>
              <dd>
                {trip.budget === null || trip.budget === undefined
                  ? 'Not set'
                  : `${trip.budget} ${trip.currency}`}
              </dd>
            </div>
            <div className="detail-row">
              <dt>Status</dt>
              <dd>
                <span className={`badge badge-${trip.status}`}>{trip.status}</span>
              </dd>
            </div>
            <div className="detail-row">
              <dt>Notes</dt>
              <dd>{trip.notes || 'No notes yet'}</dd>
            </div>
          </dl>
        </section>
      )}

      <ItinerarySection trip={trip} />
    </div>
  );
}
