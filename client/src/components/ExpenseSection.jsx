import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import {
  expenseService,
  validateExpense,
  toExpensePayload,
  emptyExpenseForm,
  expenseToForm,
  summariseExpenses,
  formatAmount,
  toCalendarDay,
} from '../services/expenseService.js';
// The backend stores a chosen day as UTC midnight, so a plain toLocaleDateString
// would show the day before in any timezone behind UTC. The calendar day is read
// off the timestamp first, then formatted, the same way the itinerary does.
import { formatDayDate as formatCalendarDate } from '../services/itineraryService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';
import ExpenseForm from './ExpenseForm.jsx';

export default function ExpenseSection({ trip }) {
  const { handleUnauthorized } = useAuth();

  // The trip id is kept next to the list, so the derived loading check can tell
  // this trip's expenses from another trip's that are still on screen.
  const [expenses, setExpenses] = useState({ trip: null, items: [] });
  // Like the trip and itinerary errors, this one carries the trip id it belongs
  // to, so switching trips never shows the previous trip's message.
  const [loadError, setLoadError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const loading = expenses.trip !== trip.id && !(loadError && loadError.tripId === trip.id);

  useEffect(() => {
    let cancelled = false;
    const tripId = trip.id;

    async function loadExpenses() {
      try {
        const data = await expenseService.listForTrip(tripId);

        if (cancelled) return;

        // The trip id is kept alongside the list so the derived loading check
        // above can tell this trip's expenses from another trip's.
        setExpenses({ trip: tripId, items: data });
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401) {
          handleUnauthorized();
          return;
        }

        setLoadError({ tripId, error });
      }
    }

    loadExpenses();

    return () => {
      cancelled = true;
    };
  }, [trip.id, handleUnauthorized]);

  function openCreate() {
    setForm(emptyExpenseForm());
    setEditingId(null);
    setErrors({});
    setSaveError(null);
    setShowForm(true);
  }

  function openEdit(expense) {
    setForm(expenseToForm(expense));
    setEditingId(expense.id);
    setErrors({});
    setSaveError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(null);
    setEditingId(null);
    setErrors({});
    setSaveError(null);
  }

  async function handleSubmit() {
    setSaveError(null);

    const found = validateExpense(form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const payload = toExpensePayload(form, { isEdit: Boolean(editingId) });

      if (editingId) {
        const updated = await expenseService.update(editingId, payload);

        setExpenses((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === updated.id ? updated : item)),
        }));
      } else {
        const created = await expenseService.create(trip.id, payload);

        // The backend already returns the list in date order, so a new expense
        // is put back into place by date rather than only pushed on the end.
        setExpenses((current) => ({
          ...current,
          items: sortByDate([...current.items, created]),
        }));
      }

      closeForm();
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

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(expense.id);
    setDeleteError(null);

    try {
      await expenseService.remove(expense.id);

      setExpenses((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== expense.id),
      }));

      // Deleting the row that is being edited closes that form too.
      if (editingId === expense.id) {
        closeForm();
      }
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }

      setDeleteError(error);
    } finally {
      setDeletingId(null);
    }
  }

  const items = expenses.trip === trip.id ? expenses.items : [];
  const summary = summariseExpenses(items);
  const currency = trip.currency || '';

  return (
    <section className="card" aria-labelledby="expenses-heading">
      <div className="section-head">
        <div>
          <h2 id="expenses-heading">Expenses</h2>
          <p className="section-sub">
            {summary.count === 0
              ? 'Track what this trip costs. Every expense is listed newest first.'
              : `${summary.count} ${summary.count === 1 ? 'expense' : 'expenses'} · total ${formatAmount(summary.total)}${currency ? ` ${currency}` : ''}`}
          </p>
        </div>

        {!showForm && (
          <button type="button" className="btn btn-ghost" onClick={openCreate}>
            Add expense
          </button>
        )}
      </div>

      <ErrorMessage
        error={loadError && loadError.tripId === trip.id ? loadError.error : null}
        onDismiss={() => setLoadError(null)}
      />
      <ErrorMessage error={deleteError} onDismiss={() => setDeleteError(null)} />
      <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />

      {showForm && (
        <div className="expense-form-card">
          <h3>{editingId ? 'Edit expense' : 'Add expense'}</h3>
          <ExpenseForm
            form={form}
            onChange={setForm}
            errors={errors}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitLabel={saving ? 'Saving...' : editingId ? 'Save expense' : 'Add expense'}
            submitting={saving}
          />
        </div>
      )}

      {loading && (
        <div className="expense-loading">
          <Spinner label="Loading expenses..." />
        </div>
      )}

      {!loading && !loadError && summary.count === 0 && !showForm && (
        <div className="empty-state">
          <h3>No expenses yet</h3>
          <p>Add the first cost for this trip to start tracking the budget.</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add expense
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="expense-list">
          {items.map((expense) => (
            <li className="expense-item" key={expense.id}>
              <div className="expense-item-main">
                <div className="expense-item-head">
                  <h3>{expense.title}</h3>
                  <span className="expense-amount">
                    {formatAmount(expense.amount)}
                    {currency ? ` ${currency}` : ''}
                  </span>
                </div>

                <p className="expense-item-meta">
                  <span className="badge">{expense.category}</span>
                  <span>{formatCalendarDate(toCalendarDay(expense.date))}</span>
                </p>

                {expense.notes && <p className="expense-item-notes">{expense.notes}</p>}
              </div>

              <div className="expense-item-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => openEdit(expense)}
                  disabled={deletingId === expense.id}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(expense)}
                  disabled={deletingId === expense.id}
                >
                  {deletingId === expense.id ? <Spinner label="Deleting..." /> : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && summary.categories.length > 0 && (
        <div className="expense-breakdown">
          <h3>By category</h3>
          <ul>
            {summary.categories.map((category) => (
              <li key={category.name}>
                <span className="expense-breakdown-name">{category.name}</span>
                <span className="expense-breakdown-amount">
                  {formatAmount(category.amount)}
                  {currency ? ` ${currency}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Same order the backend uses: newest date first, then newest first for expenses
// that share a date.
function sortByDate(items) {
  return [...items].sort((a, b) => {
    const left = new Date(a.date).getTime();
    const right = new Date(b.date).getTime();

    if (left !== right) return right - left;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
