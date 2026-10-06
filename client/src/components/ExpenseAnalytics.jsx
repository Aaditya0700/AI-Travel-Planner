import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import { expenseService, formatAmount } from '../services/expenseService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';

export default function ExpenseAnalytics({ trip }) {
  const { handleUnauthorized } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await expenseService.getAnalytics(trip.id);

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401) {
          handleUnauthorized();
          return;
        }

        setLoadError(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [trip.id, handleUnauthorized]);

  const currency = trip.currency || '';
  const hasBudget = trip.budget !== null && trip.budget !== undefined && trip.budget > 0;
  const budgetUsed = analytics?.budgetUsedPercentage;

  function getBudgetStatus() {
    if (!hasBudget || budgetUsed === null) return 'unknown';
    if (budgetUsed >= 100) return 'exceeded';
    if (budgetUsed >= 80) return 'warning';
    return 'normal';
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '—';
    return `${formatAmount(amount)}${currency ? ` ${currency}` : ''}`;
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <Spinner label="Loading analytics..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorMessage
        error={loadError}
        onDismiss={() => setLoadError(null)}
      />
    );
  }

  if (!analytics) {
    return null;
  }

  const status = getBudgetStatus();
  const isExceeded = status === 'exceeded';

  return (
    <section className="card analytics-section" aria-labelledby="analytics-heading">
      <h2 id="analytics-heading">Expense Analytics</h2>

      {/* Budget Warning */}
      {hasBudget && (status === 'warning' || status === 'exceeded') && (
        <div className={`analytics-alert analytics-alert-${status}`}>
          <span className="analytics-alert-icon">
            {status === 'exceeded' ? '⚠️' : '⚠️'}
          </span>
          <div className="analytics-alert-text">
            {isExceeded
              ? `Budget exceeded by ${formatCurrency(Math.abs(analytics.remaining))}.`
              : `You have used ${budgetUsed}% of your trip budget.`}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <dt>Total Budget</dt>
          <dd className="analytics-value">{hasBudget ? formatCurrency(analytics.budget) : 'Not set'}</dd>
        </div>
        <div className="analytics-card">
          <dt>Total Spent</dt>
          <dd className="analytics-value">{formatCurrency(analytics.totalSpent)}</dd>
        </div>
        <div className="analytics-card">
          <dt>Remaining</dt>
          <dd className={`analytics-value ${hasBudget && analytics.remaining !== null && analytics.remaining < 0 ? 'analytics-negative' : ''}`}>
            {hasBudget && analytics.remaining !== null ? formatCurrency(analytics.remaining) : '—'}
          </dd>
        </div>
        <div className="analytics-card">
          <dt>Budget Used</dt>
          <dd className="analytics-value">
            {budgetUsed !== null ? `${budgetUsed}%` : '—'}
          </dd>
        </div>
      </div>

      {/* Additional Info */}
      <div className="analytics-meta">
        <div className="analytics-meta-item">
          <dt>Number of Expenses</dt>
          <dd>{analytics.expenseCount}</dd>
        </div>
        {analytics.highestExpense && (
          <div className="analytics-meta-item">
            <dt>Highest Expense</dt>
            <dd>
              {analytics.highestExpense.title} — {formatCurrency(analytics.highestExpense.amount)}
            </dd>
          </div>
        )}
      </div>

      {/* Spending by Category */}
      {analytics.byCategory && analytics.byCategory.length > 0 && (
        <div className="analytics-chart-section">
          <h3>Spending by Category</h3>
          <div className="analytics-bars">
            {analytics.byCategory.map((cat, index) => {
              const percentage = analytics.totalSpent > 0 ? (cat.total / analytics.totalSpent) * 100 : 0;
              return (
                <div key={cat.category} className="analytics-bar-row">
                  <div className="analytics-bar-label">
                    <span className="analytics-bar-color" style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 65%, 50%)` }} />
                    <span>{cat.category}</span>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill"
                      style={{ width: `${percentage}%`, backgroundColor: `hsl(${(index * 137.5) % 360}, 65%, 50%)` }}
                    />
                  </div>
                  <span className="analytics-bar-value">{formatCurrency(cat.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending Over Time */}
      {analytics.byDate && analytics.byDate.length > 0 && (
        <div className="analytics-chart-section">
          <h3>Spending Over Time</h3>
          <div className="analytics-bars analytics-bars-vertical">
            {analytics.byDate.map((day, index) => {
              const maxDaily = Math.max(...analytics.byDate.map((d) => d.total));
              const height = maxDaily > 0 ? (day.total / maxDaily) * 100 : 0;
              return (
                <div key={day.date} className="analytics-day-bar" style={{ '--bar-height': `${height}%` }}>
                  <div className="analytics-day-bar-fill" style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 65%, 50%)` }} />
                  <span className="analytics-day-bar-value">{formatCurrency(day.total)}</span>
                  <span className="analytics-day-bar-label">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {analytics.expenseCount === 0 && (
        <div className="analytics-empty">
          <p>No expenses recorded yet.</p>
          <p>Add expenses to see analytics.</p>
        </div>
      )}
    </section>
  );
}