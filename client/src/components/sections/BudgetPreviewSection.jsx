const budgetData = {
  total: 50000,
  currency: '\u20B9',
  categories: [
    { name: 'Accommodation', amount: 18000, color: 'var(--stitch-primary)' },
    { name: 'Food', amount: 8000, color: 'var(--stitch-secondary)' },
    { name: 'Transport', amount: 10000, color: 'var(--stitch-tertiary)' },
    { name: 'Activities', amount: 7000, color: 'var(--stitch-primary-container)' },
    { name: 'Remaining', amount: 7000, color: 'var(--success)' }
  ]
};

export default function BudgetPreviewSection() {
  return (
    <section id='budget-preview' className='landing-section landing-section--alt' aria-labelledby='budget-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='budget-title' className='section-title'>Smart Budget Tracking</h2>
          <p className='section-subtext'>
            Stay in control of your travel spending with real-time insights and category breakdowns.
          </p>
        </header>

        <div className='budget-preview-grid'>
          <article className='budget-summary-card'>
            <div className='budget-total'>
              <span className='budget-label'>Trip Budget</span>
              <span className='budget-amount'>{budgetData.currency}{budgetData.total}</span>
            </div>
            <div className='budget-progress'>
              <div className='budget-progress-track' role='progressbar' aria-valuenow={86} aria-valuemin={0} aria-valuemax={100} aria-label='Budget used'>
                <div className='budget-progress-fill' style={{ width: '86%' }} />
              </div>
              <div className='budget-progress-labels'>
<span>Used: {budgetData.currency}{budgetData.categories.filter((cat) => cat.name !== 'Remaining').reduce((sum, cat) => sum + cat.amount, 0)}</span>
                <span>Remaining: {budgetData.currency}{budgetData.categories.find((cat) => cat.name === 'Remaining').amount}</span>
              </div>
            </div>
          </article>

          <article className='budget-breakdown-card'>
            <h3 className='budget-breakdown-title'>Category Breakdown</h3>
            <div className='budget-categories'>
              {budgetData.categories.map((cat) => (
                <div key={cat.name} className='budget-category'>
                  <div className='budget-category-header'>
<span className='budget-category-name'>{cat.name}</span>
                    <span className='budget-category-amount'>{budgetData.currency}{cat.amount}</span>
                  </div>
                  <div className='budget-category-bar'>
                    <div
                      className='budget-category-fill'
                      style={{
                        width: `${Math.round((cat.amount / budgetData.total) * 100)}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
