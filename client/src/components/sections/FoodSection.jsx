import { foodExperiences, getFoodImageUrl, getFoodImageUrlFromUrl, getFoodPlaceholder } from '../../data/food.js';

export default function FoodSection() {
  return (
    <section id='food' className='landing-section landing-section--alt' aria-labelledby='food-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='food-title' className='section-title'>Taste the Destination</h2>
          <p className='section-subtext'>
            Popular food experiences that define local culture — not live restaurant listings.
          </p>
        </header>

        <div className='card-grid card-grid-4'>
          {foodExperiences.map((food) => (
            <article
              key={food.id}
              className='food-card'
              data-food={food.id}
            >
              <div className='food-card-image'>
                <img
                  src={food.imageUrl ? getFoodImageUrlFromUrl(food.imageUrl) : getFoodImageUrl(food.imageId, { width: 500, height: 500 })}
                  alt={`${food.name}, ${food.destination}`}
                  loading='lazy'
                  onError={(e) => { e.currentTarget.src = getFoodPlaceholder(food.name); }}
                />
                {food.isMustTry && (
                  <span className='food-badge' aria-label='Must try'>Must Try</span>
                )}
              </div>
              <div className='food-card-content'>
                <p className='food-destination'>{food.destination}</p>
                <h3 className='food-name'>{food.name}</h3>
                <p className='food-desc'>{food.shortDesc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
