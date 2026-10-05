// A plain form, reused for both adding and editing an expense so the two
// screens cannot drift apart.
export default function ExpenseForm({
  form,
  onChange,
  errors = {},
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}) {
  function update(field) {
    return (event) => onChange({ ...form, [field]: event.target.value });
  }

  return (
    <form
      className="expense-form"
      noValidate
      onSubmit={(event) => {
        // This component owns the <form>, so it stops the browser's own submit
        // here. The event is then handed to the parent, which is where the save
        // actually happens.
        event.preventDefault();
        onSubmit(event);
      }}
    >
      <div className="field">
        <label htmlFor="expense-title">Title</label>
        <input
          id="expense-title"
          name="title"
          type="text"
          maxLength={100}
          value={form.title}
          onChange={update('title')}
          placeholder="Hotel booking"
          aria-invalid={Boolean(errors.title)}
          required
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="expense-amount">Amount</label>
          <input
            id="expense-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={update('amount')}
            placeholder="4500"
            aria-invalid={Boolean(errors.amount)}
            required
          />
          {errors.amount && <p className="field-error">{errors.amount}</p>}
        </div>

        <div className="field">
          <label htmlFor="expense-category">Category</label>
          <input
            id="expense-category"
            name="category"
            type="text"
            maxLength={50}
            value={form.category}
            onChange={update('category')}
            placeholder="Accommodation"
            aria-invalid={Boolean(errors.category)}
            required
          />
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="expense-date">Date</label>
        <input
          id="expense-date"
          name="date"
          type="date"
          value={form.date}
          onChange={update('date')}
          aria-invalid={Boolean(errors.date)}
        />
        {errors.date && <p className="field-error">{errors.date}</p>}
      </div>

      <div className="field">
        <label htmlFor="expense-notes">Notes</label>
        <textarea
          id="expense-notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={update('notes')}
          placeholder="Anything worth remembering about this cost"
          aria-invalid={Boolean(errors.notes)}
        />
        {errors.notes ? (
          <p className="field-error">{errors.notes}</p>
        ) : (
          <p className="field-hint">{form.notes.length}/500 characters</p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
