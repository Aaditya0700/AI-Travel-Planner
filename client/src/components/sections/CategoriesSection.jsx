import { categories, getCategoryImageUrl, getCategoryPlaceholder } from '../../data/categories.js';

const CATEGORY_ICON_MAP = {
  temple: 'self_improvement'
};

export default function CategoriesSection() {
  return (
    <section id='explore' className='landing-section landing-section--alt' aria-labelledby='categories-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='categories-title' className='section-title'>Explore by Category</h2>
          <p className='section-subtext'>
            Find your perfect travel experience — from mountains to food trails.
          </p>
        </header>

        <div className='card-grid card-grid-4'>
          {categories.map((cat) => (
            <article
              key={cat.id}
              className='category-card'
              data-category={cat.id}
            >
              <div className='category-card-image'>
                <img
                  src={getCategoryImageUrl(cat.imageId, { width: 500, height: 400 })}
                  alt={`${cat.label} travel`}
                  loading='lazy'
                  onError={(e) => { e.currentTarget.src = getCategoryPlaceholder(cat.label); }}
                />
                <div className='category-card-overlay' />
              </div>
              <div className='category-card-content'>
                <span className='material-symbols-outlined category-icon' aria-hidden='true'>
                  {CATEGORY_ICON_MAP[cat.icon] || cat.icon}
                </span>
                <h3 className='category-label'>{cat.label}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
