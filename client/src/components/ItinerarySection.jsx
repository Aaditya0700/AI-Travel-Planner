import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/useAuth.js';
import {
  itineraryService,
  missingDatesReason,
  formatDayDate,
  formatGeneratedAt,
} from '../services/itineraryService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';

const SLOT_ORDER = ['morning', 'afternoon', 'evening'];

const SLOTS = {
  morning: { label: 'Morning', icon: 'wb_sunny' },
  afternoon: { label: 'Afternoon', icon: 'restaurant' },
  evening: { label: 'Evening', icon: 'nights_stay' },
};

// An activity time is stored as a plain "HH:MM" string. It is only parsed for
// display, so activities can be grouped and ordered without changing the data
// the API returns.
function parseTime(value) {
  const parts = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!parts) return null;

  const hour = Number(parts[1]);
  const minute = Number(parts[2]);
  if (hour > 23 || minute > 59) return null;

  return { hour, minute, minutes: hour * 60 + minute };
}

function formatClock({ hour, minute }) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatActivityTime(value) {
  const parsed = parseTime(value);
  if (parsed) return formatClock(parsed);
  return value || 'Time to be confirmed';
}

// The span of a day or of a time slot, built from the real activity times.
function timeRange(activities) {
  const times = activities.map((activity) => parseTime(activity.time)).filter(Boolean);
  if (times.length === 0) return '';

  const first = times.reduce((min, item) => (item.minutes < min.minutes ? item : min));
  const last = times.reduce((max, item) => (item.minutes > max.minutes ? item : max));

  return `${formatClock(first)} – ${formatClock(last)}`;
}

function slotFor(activity) {
  const parsed = parseTime(activity.time);
  if (!parsed) return 'morning';
  if (parsed.hour < 12) return 'morning';
  if (parsed.hour < 18) return 'afternoon';
  return 'evening';
}

// Keeps the morning / afternoon / evening split, and orders each group by its
// start time. An activity with an unreadable time keeps its original place.
function groupBySlot(activities) {
  const grouped = { morning: [], afternoon: [], evening: [] };

  activities.forEach((activity) => {
    grouped[slotFor(activity)].push(activity);
  });

  SLOT_ORDER.forEach((slot) => {
    grouped[slot] = grouped[slot]
      .map((activity, index) => ({ activity, index }))
      .sort((left, right) => {
        const a = parseTime(left.activity.time);
        const b = parseTime(right.activity.time);

        if (a && b) return a.minutes - b.minutes || left.index - right.index;
        if (a) return -1;
        if (b) return 1;
        return left.index - right.index;
      })
      .map((entry) => entry.activity);
  });

  return grouped;
}

function SkeletonBlock({ className }) {
  return <span className={`itinerary-skeleton-block skeleton-shimmer ${className}`} />;
}

function LoadingState() {
  return (
    <section className="card" aria-labelledby="itinerary-heading">
      <div className="section-head">
        <div>
          <h2 id="itinerary-heading">AI Itinerary</h2>
          <p className="section-sub">
            Gemini reads your destination and dates and writes a day by day plan with times and
            places to visit.
          </p>
        </div>
      </div>

      <div className="itinerary-skeleton" role="status" aria-live="polite">
        <span className="visually-hidden">Checking for a saved itinerary...</span>
        <SkeletonBlock className="itinerary-skeleton-summary" />
        <div className="itinerary-skeleton-tabs" aria-hidden="true">
          <SkeletonBlock className="itinerary-skeleton-tab" />
          <SkeletonBlock className="itinerary-skeleton-tab" />
          <SkeletonBlock className="itinerary-skeleton-tab" />
          <SkeletonBlock className="itinerary-skeleton-tab" />
        </div>
        <SkeletonBlock className="itinerary-skeleton-day" />
        <SkeletonBlock className="itinerary-skeleton-activity" />
        <SkeletonBlock className="itinerary-skeleton-activity" />
      </div>
    </section>
  );
}

function TripSummary({ trip, itinerary, generating, onRegenerate }) {
  const dayCount = itinerary.days.length;
  const activityCount = itinerary.days.reduce(
    (total, day) => total + (day.activities ? day.activities.length : 0),
    0
  );
  const updatedLabel = formatGeneratedAt(itinerary.updatedAt);

  return (
    <div className="itinerary-summary">
      <div className="itinerary-summary-main">
        <span className="itinerary-summary-icon" aria-hidden="true">
          <span className="material-symbols-outlined">flight_takeoff</span>
        </span>
        <div className="itinerary-summary-text">
          <p className="itinerary-summary-eyebrow">Day-by-day plan</p>
          <h3 className="itinerary-summary-destination">{trip.destination}</h3>
          <p className="itinerary-summary-dates">
            <span className="material-symbols-outlined" aria-hidden="true">
              calendar_month
            </span>
            {formatDayDate(trip.startDate)} &ndash; {formatDayDate(trip.endDate)}
          </p>
        </div>
      </div>

      <ul className="itinerary-summary-stats">
        <li className="itinerary-summary-stat">
          <strong>{dayCount}</strong>
          <span>{dayCount === 1 ? 'day' : 'days'}</span>
        </li>
        <li className="itinerary-summary-stat">
          <strong>{activityCount}</strong>
          <span>{activityCount === 1 ? 'activity' : 'activities'}</span>
        </li>
      </ul>

      <div className="itinerary-summary-side">
        <span className="itinerary-ai-status">
          <span className="itinerary-ai-dot" aria-hidden="true" />
          <span className="itinerary-ai-text">
            AI generated{itinerary.model ? ` · ${itinerary.model}` : ''}
          </span>
        </span>
        {updatedLabel && <span className="itinerary-updated">Updated {updatedLabel}</span>}
        <button
          type="button"
          className="itinerary-regenerate-btn"
          onClick={onRegenerate}
          disabled={generating}
        >
          <span className="material-symbols-outlined itinerary-regenerate-icon" aria-hidden="true">
            refresh
          </span>
          <span>{generating ? 'Regenerating...' : 'Regenerate plan'}</span>
        </button>
      </div>
    </div>
  );
}

function DayTab({ day, isActive, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      className={`itinerary-day-tab${isActive ? ' active' : ''}`}
      aria-selected={isActive}
      aria-controls="itinerary-day-panel"
      onClick={() => onSelect(day.day)}
    >
      <span className="itinerary-day-label">Day {day.day}</span>
      <span className="itinerary-day-date">{formatDayDate(day.date)}</span>
      <span className="itinerary-day-theme">{day.title}</span>
    </button>
  );
}

function DayTabs({ days, activeDay, onSelect }) {
  return (
    <div className="itinerary-day-scroller">
      <p className="itinerary-day-scroller-title">Itinerary schedule</p>
      <div className="itinerary-day-tabs" role="tablist" aria-label="Itinerary days">
        {days.map((day) => (
          <DayTab key={day.day} day={day} isActive={day.day === activeDay} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity, number }) {
  return (
    <li className="itinerary-activity">
      <span className="itinerary-activity-rail" aria-hidden="true">
        <span className="itinerary-activity-dot" />
      </span>
      <article className="itinerary-activity-card">
        <div className="itinerary-activity-topline">
          <span className="itinerary-activity-time">
            <span className="material-symbols-outlined" aria-hidden="true">
              schedule
            </span>
            {formatActivityTime(activity.time)}
          </span>
          <span className="itinerary-activity-stop">Stop {number}</span>
        </div>
        <h4 className="itinerary-activity-title">{activity.title}</h4>
        <p className="itinerary-activity-description">{activity.description}</p>
      </article>
    </li>
  );
}

function TimeSlot({ slot, activities, startIndex }) {
  const config = SLOTS[slot];
  if (!config || activities.length === 0) return null;

  const range = timeRange(activities);

  return (
    <div className={`itinerary-slot itinerary-slot-${slot}`}>
      <div className="itinerary-slot-head">
        <span className="itinerary-slot-icon" aria-hidden="true">
          <span className="material-symbols-outlined">{config.icon}</span>
        </span>
        <h4 className="itinerary-slot-name">{config.label}</h4>
        <span className="itinerary-slot-divider" aria-hidden="true" />
        <span className="itinerary-slot-count">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
        </span>
        {range && <span className="itinerary-slot-range">{range}</span>}
      </div>
      <ol className="itinerary-activities">
        {activities.map((activity, index) => (
          <ActivityCard
            key={`${activity.time}-${index}`}
            activity={activity}
            number={startIndex + index + 1}
          />
        ))}
      </ol>
    </div>
  );
}

function DayPlan({ day, isCollapsed, onToggle }) {
  const activities = day.activities || [];

  const grouped = useMemo(() => groupBySlot(day.activities || []), [day.activities]);

  const slots = [];
  let runningTotal = 0;

  SLOT_ORDER.forEach((slot) => {
    if (grouped[slot].length === 0) return;
    slots.push({ slot, startIndex: runningTotal });
    runningTotal += grouped[slot].length;
  });

  const total = runningTotal;
  const range = timeRange(activities);
  const bodyId = 'itinerary-day-body';

  return (
    <article
      className="itinerary-day-card"
      id="itinerary-day-panel"
      role="tabpanel"
      aria-label={`Day ${day.day}: ${day.title}`}
    >
      <header className="itinerary-day-head">
        <span className="itinerary-day-badge">
          <span className="itinerary-day-badge-label">Day</span>
          <span className="itinerary-day-badge-number">{day.day}</span>
        </span>

        <div className="itinerary-day-head-body">
          <p className="itinerary-day-kicker">{formatDayDate(day.date)}</p>
          <h3 className="itinerary-day-heading">{day.title}</h3>
          <div className="itinerary-day-facts">
            <span className="itinerary-day-fact">
              <span className="material-symbols-outlined" aria-hidden="true">
                checklist
              </span>
              {total} {total === 1 ? 'activity' : 'activities'}
            </span>
            {range && (
              <span className="itinerary-day-fact">
                <span className="material-symbols-outlined" aria-hidden="true">
                  schedule
                </span>
                {range}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="itinerary-day-toggle"
          aria-expanded={!isCollapsed}
          aria-controls={bodyId}
          aria-label={`${isCollapsed ? 'Show' : 'Hide'} the plan for day ${day.day}`}
          onClick={onToggle}
        >
          <span className="itinerary-day-toggle-text">{isCollapsed ? 'Show' : 'Hide'}</span>
          <span
            className={`material-symbols-outlined itinerary-day-toggle-icon${
              isCollapsed ? ' collapsed' : ''
            }`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>
      </header>

      <div className="itinerary-day-body" id={bodyId} hidden={isCollapsed}>
        {total === 0 ? (
          <p className="itinerary-day-empty">No activities were planned for this day.</p>
        ) : (
          <div className="itinerary-timeline">
            {slots.map(({ slot, startIndex }) => (
              <TimeSlot
                key={slot}
                slot={slot}
                activities={grouped[slot]}
                startIndex={startIndex}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({ generating, onGenerate }) {
  return (
    <div className="itinerary-empty-state">
      <span className="itinerary-empty-icon" aria-hidden="true">
        <span className="material-symbols-outlined">auto_awesome</span>
      </span>
      <h3>No itinerary for this trip yet</h3>
      <p>
        Gemini reads your destination and dates, then writes a day by day plan with times and
        places to visit.
      </p>
      <div className="itinerary-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={generating}
        >
          {generating ? <Spinner label="Generating..." /> : 'Generate AI Itinerary'}
        </button>
      </div>
      {generating && (
        <p className="itinerary-status" role="status" aria-live="polite">
          Gemini is writing your plan. This can take up to a minute, so stay on this page.
        </p>
      )}
    </div>
  );
}

export default function ItinerarySection({ trip }) {
  const { handleUnauthorized } = useAuth();

  const [itinerary, setItinerary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [checkedTripId, setCheckedTripId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [activeDay, setActiveDay] = useState(1);
  // The day number whose plan is collapsed, or null when every day is open.
  const [collapsedDay, setCollapsedDay] = useState(null);

  const reason = missingDatesReason(trip);

  const loading =
    itinerary?.trip !== trip.id &&
    checkedTripId !== trip.id &&
    !(loadError && loadError.tripId === trip.id);

  const hasItinerary = itinerary?.trip === trip.id;

  useEffect(() => {
    let cancelled = false;
    const tripId = trip.id;

    if (reason) return undefined;

    async function loadItinerary() {
      try {
        const found = await itineraryService.getByTripId(tripId);

        if (cancelled) return;

        if (found) {
          setItinerary(found);
          setActiveDay(1);
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
      setActiveDay(1);
      setCollapsedDay(null);
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }

      setGenerateError(error);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  const day = hasItinerary
    ? itinerary.days.find((item) => item.day === activeDay) || itinerary.days[0]
    : null;

  return (
    <section className="card itinerary-card" aria-labelledby="itinerary-heading">
      <div className="section-head">
        <div>
          <h2 id="itinerary-heading">AI Itinerary</h2>
          <p className="section-sub">
            Gemini reads your destination and dates and writes a day by day plan with times and
            places to visit.
          </p>
        </div>
      </div>

      {reason && (
        <p className="itinerary-note">
          <span className="material-symbols-outlined itinerary-note-icon" aria-hidden="true">
            info
          </span>
          <span>{reason}</span>
        </p>
      )}

      <ErrorMessage
        error={loadError && loadError.tripId === trip.id ? loadError.error : null}
        onDismiss={() => setLoadError(null)}
      />
      <ErrorMessage error={generateError} onDismiss={() => setGenerateError(null)} />

      {!hasItinerary && !reason && (
        <EmptyState generating={generating} onGenerate={handleGenerate} />
      )}

      {hasItinerary && !day && (
        <p className="itinerary-day-empty">This itinerary does not have any days yet.</p>
      )}

      {hasItinerary && day && (
        <>
          <TripSummary
            trip={trip}
            itinerary={itinerary}
            generating={generating}
            onRegenerate={handleGenerate}
          />

          {generating && (
            <p className="itinerary-status" role="status" aria-live="polite">
              Gemini is rewriting your plan. This can take up to a minute, so stay on this page.
            </p>
          )}

          <DayTabs days={itinerary.days} activeDay={day.day} onSelect={setActiveDay} />

          <DayPlan
            day={day}
            isCollapsed={collapsedDay === day.day}
            onToggle={() =>
              setCollapsedDay((current) => (current === day.day ? null : day.day))
            }
          />
        </>
      )}
    </section>
  );
}
