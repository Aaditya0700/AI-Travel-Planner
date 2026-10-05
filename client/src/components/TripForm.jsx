import { TRIP_STATUSES } from '../services/tripService.js';

// A plain form, reused for both creating and editing a trip so the two
// screens cannot drift apart.
export default function TripForm({ form, onChange, errors = {}, onSubmit, onCancel, submitLabel }) {
  function update(field) {
    return (event) => onChange({ ...form, [field]: event.target.value });
  }

  return (
    <form
      className="trip-form"
      noValidate
      onSubmit={(event) => {
        // This component owns the <form>, so it stops the browser's own
        // submit here. The event is then handed to the parent, which is
        // where the save actually happens.
        event.preventDefault();
        onSubmit(event);
      }}
    >
      <div className="field">
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          name="destination"
          type="text"
          value={form.destination}
          onChange={update('destination')}
          placeholder="Kyoto, Japan"
          aria-invalid={Boolean(errors.destination)}
          required
        />
        {errors.destination && <p className="field-error">{errors.destination}</p>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={update('startDate')}
            aria-invalid={Boolean(errors.startDate)}
          />
          {errors.startDate && <p className="field-error">{errors.startDate}</p>}
        </div>

        <div className="field">
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={update('endDate')}
            aria-invalid={Boolean(errors.endDate)}
          />
          {errors.endDate && <p className="field-error">{errors.endDate}</p>}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="budget">Budget</label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            value={form.budget}
            onChange={update('budget')}
            placeholder="25000"
            aria-invalid={Boolean(errors.budget)}
          />
          {errors.budget && <p className="field-error">{errors.budget}</p>}
        </div>

        <div className="field">
          <label htmlFor="currency">Currency</label>
          <input
            id="currency"
            name="currency"
            type="text"
            maxLength={3}
            value={form.currency}
            onChange={update('currency')}
            placeholder="INR"
            aria-invalid={Boolean(errors.currency)}
          />
          {errors.currency && <p className="field-error">{errors.currency}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={form.status} onChange={update('status')}>
          {TRIP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={form.notes}
          onChange={update('notes')}
          placeholder="Anything the planner should know about this trip"
          aria-invalid={Boolean(errors.notes)}
        />
        {errors.notes ? (
          <p className="field-error">{errors.notes}</p>
        ) : (
          <p className="field-hint">{form.notes.length}/500 characters</p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
