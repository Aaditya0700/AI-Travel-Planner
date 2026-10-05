import { api } from './apiClient.js';
// The expense date is a full ISO timestamp stored at UTC midnight, so it is
// read with the same calendar day helper the trips use.
import { toCalendarDay, toDateInputValue } from './tripService.js';

export { toCalendarDay };

// Matches the routes in server/src/routes/expenses.js.
export const expenseService = {
  // The backend already scopes the list to this user, and sorting by date is
  // done there too, so nothing is re-ordered here.
  async listForTrip(tripId) {
    const data = await api.get(`/api/v1/expenses?tripId=${tripId}`);
    return data.expenses;
  },

  // The trip id is passed separately so the form never has to carry it, which
  // keeps a form value from ever deciding which trip an expense belongs to.
  async create(tripId, expense) {
    const data = await api.post('/api/v1/expenses', { tripId, ...expense });
    return data.expense;
  },

  async update(id, expense) {
    const data = await api.put(`/api/v1/expenses/${id}`, expense);
    return data.expense;
  },

  async remove(id) {
    return api.delete(`/api/v1/expenses/${id}`);
  },
};

// The rules below are copied from the backend validators in
// server/src/validators/expenseValidators.js, so the user gets the same
// feedback before a request is sent.
export function validateExpense(expense) {
  const errors = {};

  const title = expense.title.trim();

  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length > 100) {
    errors.title = 'Title must be at most 100 characters';
  }

  if (expense.amount === '' || Number.isNaN(Number(expense.amount))) {
    errors.amount = 'Amount is required and must be a number';
  } else if (Number(expense.amount) < 0) {
    errors.amount = 'Amount cannot be negative';
  }

  const category = expense.category.trim();

  if (!category) {
    errors.category = 'Category is required';
  } else if (category.length > 50) {
    errors.category = 'Category must be at most 50 characters';
  }

  if (expense.date && Number.isNaN(new Date(expense.date).getTime())) {
    errors.date = 'Date must be a valid date';
  }

  if (expense.notes.length > 500) {
    errors.notes = 'Notes must be at most 500 characters';
  }

  return errors;
}

// Optional fields are left out when they are empty, so the backend keeps its own
// defaults instead of receiving an empty string. Notes are the exception on an
// edit: the backend only changes a field it is sent, so leaving a cleared note
// out would keep the old text instead of removing it.
export function toExpensePayload(form, { isEdit = false } = {}) {
  const payload = {
    title: form.title.trim(),
    amount: Number(form.amount),
    category: form.category.trim(),
  };

  if (form.date) payload.date = form.date;
  if (isEdit || form.notes.trim()) payload.notes = form.notes.trim();

  return payload;
}

// The date defaults to today, which is also what the backend would have used.
export function emptyExpenseForm() {
  return {
    title: '',
    amount: '',
    category: '',
    date: toDateInputValue(new Date()),
    notes: '',
  };
}

export function expenseToForm(expense) {
  return {
    title: expense.title || '',
    amount: String(expense.amount),
    category: expense.category || '',
    date: toDateInputValue(expense.date),
    notes: expense.notes || '',
  };
}

// The totals are worked out from the list the page already has, so no extra
// request is needed for a number that is a simple sum of what is on screen.
export function summariseExpenses(expenses) {
  const categories = new Map();
  let total = 0;

  expenses.forEach((expense) => {
    total += Number(expense.amount) || 0;
    categories.set(
      expense.category,
      (categories.get(expense.category) || 0) + (Number(expense.amount) || 0),
    );
  });

  return {
    total,
    count: expenses.length,
    // Biggest first, because that is the part worth looking at.
    categories: Array.from(categories.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export function formatAmount(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return '0';

  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
