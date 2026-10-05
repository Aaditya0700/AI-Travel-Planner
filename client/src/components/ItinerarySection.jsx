import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import {
  itineraryService,
  missingDatesReason,
  formatDayDate,
  formatGeneratedAt,
} from '../services/itineraryService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';

// The Gemini response, in the shape server/src/models/Itinerary.js sends:
// days[].{day, date, title} and days[].activities[].{time, title, description}.
function ItineraryDay({ day }) {
  return (
    <li className="itinerary-day">
      <div className="itinerary-day-head">
        <h3>Day {day.day}</h3>
        <span className="itinerary-day-date">{formatDayDate(day.date)}</span>
        {day.title && <span className="itinerary-day-title">{day.title}</span>}
      </div>

      {day.activities.length === 0 ? (
        <p className="itinerary-empty">No activities were listed for this day.</p>
      ) : (
        <ul className="itinerary-activities">
          {day.activities.map((activity, index) => (
            <li className="itinerary-activity" key={`${day.day}-${activity.time}-${index}`}>
              <span className="itinerary-time">{activity.time}</span>
              <div>
                <p className="itinerary-activity-title">{activity.title}</p>
                <p className="itinerary-activity-description">{activity.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ItinerarySection({ trip }) {
  const { handleUnauthorized } = useAuth();

  const [itinerary, setItinerary] = useState(null);
  // Like the trip error above, the itinerary error carries its trip id, so
  // moving to another trip never shows the previous trip's message.
  const [loadError, setLoadError] = useState(null);
  // The trip id that has been checked and has no plan yet. Remembered instead
  // of a boolean so the same trip is not looked up again on every render.
  const [checkedTripId, setCheckedTripId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const reason = missingDatesReason(trip);

  const loading =
    itinerary?.trip !== trip.id &&
    checkedTripId !== trip.id &&
    !(loadError && loadError.tripId === trip.id);

  useEffect(() => {
    let cancelled = false;
    const tripId = trip.id;

    // A trip with no dates can never be planned, so nothing is requested.
    if (reason) return undefined;

    async function loadItinerary() {
      try {
        const found = await itineraryService.getByTripId(tripId);

        if (cancelled) return;

        if (found) {
          setItinerary(found);
        } else {
          setCheckedTripId(tripId);
        }
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401) {
          handleUnauthorized();
          return;
        }

        setLoadError({ tripId, error });
      }
    }

    loadItinerary();

    return () => {
      cancelled = true;
    };
  }, [trip.id, trip.startDate, trip.endDate, reason, handleUnauthorized]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);

    try {
      const created = await itineraryService.generate(trip.id);

      setItinerary(created);
      setCheckedTripId(null);
      setLoadError(null);
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }

      // The backend answers with short sentences here, so the message is safe
      // to show as it is and the button stays available for a retry.
      setGenerateError(error);
    } finally {
      setGenerating(false);
    }
  }

  const hasItinerary = itinerary?.trip === trip.id;
  const generatedAt = formatGeneratedAt(itinerary?.updatedAt);

  return (
    <section className="card" aria-labelledby="itinerary-heading">
      <h2 id="itinerary-heading">AI Itinerary</h2>
      <p className="section-sub">
        Gemini reads your destination and dates and writes a day by day plan with times and places
        to visit.
      </p>

      {reason && <p className="itinerary-note">{reason}</p>}

      <ErrorMessage
        error={loadError && loadError.tripId === trip.id ? loadError.error : null}
        onDismiss={() => setLoadError(null)}
      />
      <ErrorMessage error={generateError} onDismiss={() => setGenerateError(null)} />

      {loading && (
        <div className="itinerary-loading">
          <Spinner label="Checking for a saved itinerary..." />
        </div>
      )}

      {!loading && hasItinerary && (
        <>
          <p className="itinerary-meta">
            {generatedAt && <span>Generated {generatedAt}</span>}
            {itinerary.model && <span>Model: {itinerary.model}</span>}
          </p>

          {itinerary.days.length === 0 ? (
            <p className="itinerary-empty">This plan has no days in it yet.</p>
          ) : (
            <ol className="itinerary-days">
              {itinerary.days.map((day) => (
                <ItineraryDay key={day.day} day={day} />
              ))}
            </ol>
          )}
        </>
      )}

      {!loading && !reason && (
        <div className="itinerary-actions">
          <button
            type="button"
            className={hasItinerary ? 'btn btn-ghost' : 'btn btn-primary'}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Spinner label="Generating..." />
            ) : hasItinerary ? (
              'Regenerate itinerary'
            ) : (
              'Generate AI Itinerary'
            )}
          </button>

          {generating && (
            <p className="itinerary-status" role="status" aria-live="polite">
              Gemini is writing your plan. This can take up to a minute, so stay on this page.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
